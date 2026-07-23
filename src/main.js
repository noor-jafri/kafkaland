import * as THREE from 'three';
import { CAMERA_ZOOM, INTERACT_RADIUS, FRUSTRATION, FRUSTRATION_PROMPTS, DAY_TIMER, NAG, TRAIL } from './config.js';
import { loadAll } from './textures.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { HUD } from './ui.js';
import { Screens } from './screens.js';
import { buildEnemies } from './enemies.js';
import { Nag } from './nag.js';
import { wasPressed, endFrame } from './input.js';
import { DIALOGUES, NAG_LINES, VENT_LINES } from './content.js';
import LEVEL1 from './levels/level1.js';
import LEVEL2 from './levels/level2.js';

const LEVELS = { 1: LEVEL1, 2: LEVEL2 };

async function start() {
  const app = document.getElementById('app');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2e4a2e');

  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 100);
  camera.position.z = 10;
  function resize() {
    const w = window.innerWidth / CAMERA_ZOOM;
    const h = window.innerHeight / CAMERA_ZOOM;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  const textures = await loadAll();
  const hud = new HUD();
  const nag = new Nag(scene);
  nag.onSpawn = () => hud.toast('📮 ' + NAG_LINES.spawn);
  nag.onLeave = (m) => hud.toast('📮 ' + m);

  // --- Per-run objects & state, (re)built each level ---
  let level, world, player, enemies;
  let started = false;
  let frustration = 0;
  let hitCooldown = 0;
  let playTime = 0;
  let curDay = 1;
  let lateWarned = false;
  let registered = false;
  let pendingWin = false;
  let frustPromptIdx = 0;
  let trailTimer = 0;
  let claimed = new Set();

  // Build (or rebuild) a level. keepIds are backpack items that carry over.
  function loadLevel(id, keepIds = []) {
    level = LEVELS[id];
    if (world) scene.remove(world.root);
    world = buildWorld(scene, textures, level);
    enemies = buildEnemies(world.root, textures, world.enemySpawns);
    if (!player) player = new Player(scene, textures, world.playerStart);
    else player.pos.copy(world.playerStart);

    hud.keepItems(keepIds);
    frustration = 0;
    hitCooldown = 0;
    playTime = 0;
    curDay = 1;
    lateWarned = false;
    registered = false;
    pendingWin = false;
    frustPromptIdx = 0;
    trailTimer = 0;
    claimed = new Set();
    nag.reset();

    camera.position.x = player.pos.x;
    camera.position.y = player.pos.y;
    window.__game = { level, player, camera, world, screens }; // debug handle
  }

  function announceLevel() {
    hud.setObjective(level.startObjective);
    hud.setDay(1, DAY_TIMER.deadlineDay);
    hud.setFrustration(0, FRUSTRATION.max);
    hud.toast(level.startToast);
  }

  const screens = new Screens({
    onStart: () => {
      started = true;
      announceLevel();
    },
  });

  loadLevel(1); // build a world to render behind the title screen

  // --- Helpers that read the current `level` ---
  function itemName(id) {
    const doc = Object.values(level.documents || {}).find((d) => d.id === id);
    return doc?.name || level.granted[id]?.name || id;
  }

  function grantItems(ids) {
    for (const id of ids) {
      const it = level.granted[id];
      hud.addItem(it);
      if (it.fact) screens.queueFact(it.fact);
    }
  }

  function collect(item) {
    item.collected = true;
    item.mesh.removeFromParent();
    hud.addItem(item);
    if (item.fact) screens.queueFact(item.fact);
    // Objective checkpoint: picking up the level's key document advances the goal.
    if (item.id === (level.passportItem || 'passport') && level.passportObjective) {
      hud.setObjective(level.passportObjective);
    }
  }

  function addFrustration(amount) {
    frustration = Math.min(FRUSTRATION.max, frustration + amount);
    const frac = frustration / FRUSTRATION.max;
    while (frustPromptIdx < FRUSTRATION_PROMPTS.length && frac >= FRUSTRATION_PROMPTS[frustPromptIdx]) {
      frustPromptIdx++;
      hud.toast('😤 Frustration is high. Find a tree and press F to vent it out.');
    }
  }

  function interactNpc(npc) {
    if (npc.goal) {
      const hasAll = level.required.every((id) => hud.hasItem(id));
      if (hasAll) {
        const d = DIALOGUES[npc.completeDialogue];
        screens.startDialogue(d.speaker, d.lines, () => {
          grantItems(d.grants);
          registered = true;
          pendingWin = true; // win screen shows once the last fact card is dismissed
          hud.setObjective(`✅ ${level.name} complete!`);
        });
      } else {
        const d = DIALOGUES[npc.incompleteDialogue];
        const missing = level.required.filter((id) => !hud.hasItem(id)).map(itemName);
        const lines = [...d.lines, `You are still missing: ${missing.join(', ')}. No documents, no service. Come back when you're complete.`];
        screens.startDialogue(d.speaker, lines);
      }
      return;
    }
    // Hard gate: refuse until the player holds every required item.
    if (npc.requires && !npc.requires.every((id) => hud.hasItem(id))) {
      const g = DIALOGUES[npc.gateDialogue];
      screens.startDialogue(g.speaker, g.lines);
      return;
    }
    if (npc.claimOnce && claimed.has(npc.id)) {
      hud.toast(npc.claimedToast);
      return;
    }
    const d = DIALOGUES[npc.dialogue];
    const onDone = d.grants
      ? () => {
          if (npc.claimOnce) claimed.add(npc.id);
          grantItems(d.grants);
          if (npc.nextObjective) hud.setObjective(npc.nextObjective);
        }
      : undefined;
    screens.startDialogue(d.speaker, d.lines, onDone);
  }

  // Nearest document / npc within interact radius.
  function nearestTarget() {
    let best = null;
    let bestDist = INTERACT_RADIUS;
    for (const item of world.items) {
      if (item.collected) continue;
      const d = Math.hypot(item.x - player.pos.x, item.baseY - player.pos.y);
      if (d < bestDist) { bestDist = d; best = { kind: 'doc', item }; }
    }
    for (const npc of world.npcs) {
      const d = Math.hypot(npc.x - player.pos.x, npc.y - player.pos.y);
      if (d < bestDist) { bestDist = d; best = { kind: 'npc', npc }; }
    }
    return best;
  }

  function nearestTree() {
    let best = null;
    let bestDist = INTERACT_RADIUS;
    for (const t of world.trees) {
      const d = Math.hypot(t.x - player.pos.x, t.y - player.pos.y);
      if (d < bestDist) { bestDist = d; best = t; }
    }
    return best;
  }

  const clock = new THREE.Clock();
  let elapsed = 0;

  function frame() {
    requestAnimationFrame(frame);
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== window.innerWidth || size.y !== window.innerHeight) resize();
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    // Screens own input while any overlay/menu is up. Capture that BEFORE updating
    // them, so the frame an overlay closes doesn't also trigger a world action.
    const wasBlocking = screens.blocking();
    screens.update();

    // Show the win screen once the final fact card is dismissed.
    if (pendingWin && !screens.blocking()) {
      pendingWin = false;
      screens.showWon(hud.items, level.win, () => loadLevel(2, ['meldebescheinigung']));
    }

    const frozen = wasBlocking || !started;
    player.update(dt, world, frozen);

    // Camera follows the player, clamped to map edges.
    const viewW = camera.right - camera.left;
    const viewH = camera.top - camera.bottom;
    const cx = Math.max(viewW / 2, Math.min(world.width - viewW / 2, player.pos.x));
    const cy = Math.max(viewH / 2, Math.min(world.height - viewH / 2, player.pos.y));
    camera.position.x += (cx - camera.position.x) * Math.min(1, dt * 8);
    camera.position.y += (cy - camera.position.y) * Math.min(1, dt * 8);

    // Document bob (visual only) always runs.
    for (const item of world.items) {
      if (item.collected) continue;
      item.mesh.position.y = item.baseY + Math.sin(elapsed * 3 + item.baseY) * 2;
    }

    if (started && !frozen && !registered) {
      // Day clock.
      playTime += dt;
      const day = 1 + Math.floor(playTime / DAY_TIMER.secondsPerDay);
      if (day !== curDay) {
        curDay = day;
        hud.setDay(curDay, DAY_TIMER.deadlineDay);
        if (curDay > DAY_TIMER.deadlineDay && !lateWarned) {
          lateWarned = true;
          hud.toast('⚠️ Past the 14-day deadline! (Small fine — but Nuremberg lets it slide. Keep going.)');
        }
      }

      // Record a breadcrumb trail for the Nag to follow.
      trailTimer -= dt;
      if (trailTimer <= 0) {
        trailTimer = TRAIL.sampleInterval;
        world.trail.push({ x: player.pos.x, y: player.pos.y });
        if (world.trail.length > TRAIL.maxPoints) world.trail.shift();
      }

      // Enemies (slimes, bats): contact adds frustration.
      hitCooldown = Math.max(0, hitCooldown - dt);
      for (const e of enemies) {
        e.update(dt);
        if (hitCooldown === 0) {
          const d = Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y);
          if (d < e.contactRadius) {
            hitCooldown = FRUSTRATION.hitCooldown;
            addFrustration(FRUSTRATION.perSlimeHit);
            hud.toast(e.kind === 'bat'
              ? '🦇 Processing delay! Your file drops to the bottom of the pile. (+frustration)'
              : '🟢 Red tape! Conflicting information! (+frustration)');
          }
        }
      }

      // Nag: the Collector.
      const nagResult = nag.update(dt, world, player, false);
      if (nagResult === 'caught') {
        addFrustration(FRUSTRATION.perNagCaught);
        hud.toast('📮 ' + NAG_LINES.caught);
        screens.queueFact('rundfunk');
        nag.despawn();
      } else if (nagResult === 'fled') {
        nag.despawn(NAG_LINES.fled, true);
      }

      // Passive frustration decay (re-arms the vent prompts as you calm down).
      frustration = Math.max(0, frustration - 4 * dt);
      const frac = frustration / FRUSTRATION.max;
      while (frustPromptIdx > 0 && frac < FRUSTRATION_PROMPTS[frustPromptIdx - 1]) frustPromptIdx--;
      hud.setFrustration(frustration, FRUSTRATION.max);

      // Vent: punch a nearby tree with F.
      const tree = nearestTree();
      if (tree && wasPressed('KeyF') && !player.punching) {
        player.vent();
        frustration = Math.max(0, frustration - FRUSTRATION.ventDrain);
        hud.setFrustration(frustration, FRUSTRATION.max);
        hud.toast(VENT_LINES[Math.floor(Math.random() * VENT_LINES.length)]);
        tree.mesh.position.x += 1.5; // tiny nudge; eased back below
        tree._shake = 0.25;
      }
      for (const t of world.trees) {
        if (t._shake > 0) {
          t._shake -= dt;
          t.mesh.position.x += Math.sin(elapsed * 60) * 0.6;
        }
      }

      // Contextual interact prompt + E handling.
      let prompt = null;
      if (nag.isNear(player)) {
        prompt = '<b>E</b> — Pay the Rundfunkbeitrag (make him leave)';
      } else {
        const target = nearestTarget();
        if (target?.kind === 'doc') prompt = `<b>E</b> — Pick up ${target.item.name}`;
        else if (target?.kind === 'npc') {
          const npc = target.npc;
          if (npc.claimOnce && claimed.has(npc.id)) prompt = null;
          else prompt = `<b>E</b> — ${npc.prompt || 'Interact'}`;
        }
      }
      if (!prompt && tree) prompt = '<b>F</b> — punch the tree (vent)';
      hud.showPrompt(prompt);

      if (wasPressed('KeyE')) {
        if (nag.isNear(player)) {
          nag.despawn(NAG_LINES.paid);
          screens.queueFact('rundfunk');
        } else {
          const target = nearestTarget();
          if (target?.kind === 'doc') collect(target.item);
          else if (target?.kind === 'npc') interactNpc(target.npc);
        }
      }
    } else {
      hud.showPrompt(null);
    }

    renderer.render(scene, camera);
    endFrame();
  }
  frame();
}

start();
