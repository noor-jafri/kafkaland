import * as THREE from 'three';
import { CAMERA_ZOOM, INTERACT_RADIUS, FRUSTRATION, DAY_TIMER, NAG, TRAIL } from './config.js';
import { loadAll } from './textures.js';
import { buildWorld, surfaceAt } from './world.js';
import { Player } from './player.js';
import { HUD } from './ui.js';
import { Screens } from './screens.js';
import { CompanionPanel } from './companion.js';
import { GameAudio } from './audio/game-audio.js';
import { AudioSettingsPanel } from './audio/settings.js';
import { buildEnemies } from './enemies.js';
import { Nag } from './nag.js';
import { wasPressed, endFrame } from './input.js';
import { DIALOGUES, CONFLICT_LINES, UNTAETIGKEIT } from './content.js';
import LEVEL1 from './levels/level1.js';
import LEVEL2 from './levels/level2.js';
import LEVEL3 from './levels/level3.js';

const LEVELS = { 1: LEVEL1, 2: LEVEL2, 3: LEVEL3 };

async function start() {
  const app = document.getElementById('app');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Kafkaland game world. Use WASD or arrow keys to move.');
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

  const gameAudio = new GameAudio();
  gameAudio.installGestureUnlock();
  const audioSettings = new AudioSettingsPanel(gameAudio);

  const textures = await loadAll();
  const hud = new HUD();
  const companion = new CompanionPanel({ onAudioEvent: (name, detail) => gameAudio.emit(name, detail) });
  const hudEl = document.getElementById('hud');
  const nag = new Nag(scene);
  nag.onSpawn = () => gameAudio.emit('mail-delivery');

  // --- Per-run objects & state, (re)built each level ---
  let level, world, player, enemies;
  let started = false;
  let frustration = 0;
  let hitCooldown = 0;
  let playTime = 0;
  let curDay = 1;
  let registered = false;
  let pendingWin = false;
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
    registered = false;
    pendingWin = false;
    trailTimer = 0;
    claimed = new Set();
    nag.reset();

    camera.position.x = player.pos.x;
    camera.position.y = player.pos.y;
    hud.setChecklist(level.checklist);
    window.__game = { level, player, camera, world, screens, companion, audio: gameAudio, audioSettings }; // debug handle
  }

  function refreshChecklist() {
    hud.setChecklist(level.checklist);
  }

  function announceLevel() {
    hud.setMission(level.mission.tag, level.mission.aim);
    hud.setObjective(level.startObjective);
    hud.setDay(1, DAY_TIMER.deadlineDay);
    hud.setFrustration(0, FRUSTRATION.max);
    hud.setChecklist(level.checklist);
  }

  const screens = new Screens({
    onAudioEvent: (name, detail) => gameAudio.emit(name, detail),
    onStart: () => {
      started = true;
      gameAudio.startGame();
      gameAudio.setDeadlineProgress(1, DAY_TIMER.deadlineDay);
      companion.prepare();
      screens.showLevelIntro(level.mission, announceLevel);
    },
  });

  window.addEventListener('beforeunload', () => {
    audioSettings.dispose();
    gameAudio.dispose();
  }, { once: true });

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
    refreshChecklist();
  }

  function collect(item) {
    item.collected = true;
    item.mesh.removeFromParent();
    gameAudio.emit('document-pickup');
    hud.addItem(item);
    refreshChecklist();
    if (item.fact) screens.queueFact(item.fact);
    // Objective checkpoint: picking up the level's key document advances the goal.
    if (item.id === (level.passportItem || 'passport') && level.passportObjective) {
      hud.setObjective(level.passportObjective);
    }
  }

  function addFrustration(amount) {
    frustration = Math.min(FRUSTRATION.max, frustration + amount);
    gameAudio.emit('frustration-increase');
  }

  function interactNpc(npc) {
    if (npc.id === 'companion') {
      companion.open();
      return;
    }
    // Untätigkeit mini-boss: endure escalating forms; eventually it gives up.
    if (npc.boss) {
      gameAudio.emit('building-enter');
      npc._step = npc._step || 0;
      if (npc._step < UNTAETIGKEIT.steps.length) {
        screens.startDialogue(UNTAETIGKEIT.speaker, [UNTAETIGKEIT.steps[npc._step]]);
        npc._step++;
      } else {
        screens.startDialogue(UNTAETIGKEIT.speaker, [UNTAETIGKEIT.giveUp], () => {
          screens.queueFact('untaetigkeit');
          npc.mesh.removeFromParent();
          world.npcs = world.npcs.filter((n) => n !== npc);
        });
      }
      return;
    }
    if (npc.goal) {
      const hasAll = level.required.every((id) => hud.hasItem(id));
      gameAudio.emit('building-enter');
      if (hasAll) {
        const d = DIALOGUES[npc.completeDialogue];
        screens.startDialogue(d.speaker, d.lines, () => {
          gameAudio.emit('rubber-stamp');
          grantItems(d.grants);
          registered = true;
          if (level.id === 1) companion.recordProgress('complete_level_1');
          if (level.id === 2) companion.recordProgress('complete_level_2');
          pendingWin = true; // win screen shows once the last fact card is dismissed
          hud.setObjective(`✅ ${level.name} complete!`);
        });
      } else {
        gameAudio.emit('missing-document');
        gameAudio.emit('quest-failure', { gain: 0.55 });
        const d = DIALOGUES[npc.incompleteDialogue];
        const missing = level.required.filter((id) => !hud.hasItem(id)).map(itemName);
        const lines = [...d.lines, `You are still missing: ${missing.join(', ')}. No documents, no service. Come back when you're complete.`];
        screens.startDialogue(d.speaker, lines);
      }
      return;
    }
    // Hard gate: refuse until the player holds every required item.
    if (npc.requires && !npc.requires.every((id) => hud.hasItem(id))) {
      gameAudio.emit('missing-document');
      const g = DIALOGUES[npc.gateDialogue];
      screens.startDialogue(g.speaker, g.lines);
      return;
    }
    if (npc.claimOnce && claimed.has(npc.id)) return;
    gameAudio.emit('building-enter');
    const d = DIALOGUES[npc.dialogue];
    const onDone = d.grants
      ? () => {
          if (npc.claimOnce) claimed.add(npc.id);
          grantItems(d.grants);
          if (level.id === 1 && npc.id === 'apartment') companion.recordProgress('complete_housing');
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
    const wasBlocking = screens.blocking() || companion.isOpen() || audioSettings.isOpen();
    if (!companion.isOpen() && !audioSettings.isOpen()) screens.update();

    // Declutter: hide the HUD panels while any overlay (dialogue, fact card,
    // codex, menus) owns the screen.
    hudEl.classList.toggle('quiet', screens.blocking());

    // Show the win screen once the final fact card is dismissed.
    if (pendingWin && !screens.blocking()) {
      pendingWin = false;
      const nextId = level.id + 1;
      // The Meldebescheinigung is the master key — it carries forward as the
      // running "you finally exist" gag; per-level docs stay in their level.
      const carry = ['meldebescheinigung'];
      screens.showWon(hud.items, level.win, () => {
        loadLevel(nextId, carry);
        screens.showLevelIntro(level.mission, announceLevel);
      });
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
        gameAudio.setDeadlineProgress(curDay, DAY_TIMER.deadlineDay);
      }

      // Record a breadcrumb trail for the Nag to follow.
      trailTimer -= dt;
      if (trailTimer <= 0) {
        trailTimer = TRAIL.sampleInterval;
        world.trail.push({ x: player.pos.x, y: player.pos.y });
        if (world.trail.length > TRAIL.maxPoints) world.trail.shift();
      }

      // Enemies (slimes, bats, conflict officials): contact adds frustration,
      // except the conflict official, who instead runs a one-time comedy loop.
      hitCooldown = Math.max(0, hitCooldown - dt);
      for (const e of enemies) {
        e.update(dt);
        const d = Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y);
        if (e.kind === 'conflict') {
          if (!e.resolved && d < e.contactRadius) {
            e.resolved = true;
            screens.startDialogue(CONFLICT_LINES.speaker, CONFLICT_LINES.lines);
          }
          continue;
        }
        if (hitCooldown === 0 && d < e.contactRadius) {
          hitCooldown = FRUSTRATION.hitCooldown;
          gameAudio.emit('slime-collision');
          addFrustration(FRUSTRATION.perSlimeHit);
        }
      }

      // Nag: the Collector.
      const nagResult = nag.update(dt, world, player, false);
      if (nagResult === 'caught') {
        addFrustration(FRUSTRATION.perNagCaught);
        screens.queueFact('rundfunk');
        nag.despawn();
      } else if (nagResult === 'fled') {
        nag.despawn(undefined, true);
      }

      // Passive frustration decay.
      frustration = Math.max(0, frustration - 4 * dt);
      hud.setFrustration(frustration, FRUSTRATION.max);

      // Vent: punch a nearby tree with F.
      const tree = nearestTree();
      if (tree && wasPressed('KeyF') && !player.punching) {
        player.vent();
        gameAudio.emit('tree-vent');
        frustration = Math.max(0, frustration - FRUSTRATION.ventDrain);
        hud.setFrustration(frustration, FRUSTRATION.max);
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
          gameAudio.emit('paper-rustle');
          nag.despawn();
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

    gameAudio.update(dt, {
      active: started && !frozen && !registered,
      moving: player.moving,
      surface: surfaceAt(world, player.pos.x, player.pos.y),
      slimeNearby: enemies.some((enemy) => enemy.kind === 'slime' && Math.hypot(
        enemy.pos.x - player.pos.x,
        enemy.pos.y - player.pos.y
      ) < 120),
    });

    renderer.render(scene, camera);
    endFrame();
  }
  frame();
}

start();
