import * as THREE from 'three';
import { CAMERA_ZOOM, INTERACT_RADIUS, FRUSTRATION, DAY_TIMER } from './config.js';
import { loadAll } from './textures.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { HUD } from './ui.js';
import { Screens } from './screens.js';
import { buildSlimes } from './enemies.js';
import { Nag } from './nag.js';
import { wasPressed, endFrame } from './input.js';
import { DIALOGUES, NAG_LINES, VENT_LINES } from './content.js';
import { REQUIRED_FOR_ANMELDUNG } from './map.js';

// Items handed over by NPCs (not found on the map).
const GRANTED = {
  mietvertrag: { id: 'mietvertrag', name: 'Mietvertrag', icon: '📑', fact: 'mietvertrag' },
  wohnungsgeberbestaetigung: { id: 'wohnungsgeberbestaetigung', name: 'Wohnungsgeberbestätigung', icon: '🏠', fact: 'wohnungsgeberbestaetigung' },
  meldebescheinigung: { id: 'meldebescheinigung', name: 'Meldebescheinigung', icon: '📄', fact: 'meldebescheinigung' },
};

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
  const world = buildWorld(scene, textures);
  const player = new Player(scene, textures, world.playerStart);
  const hud = new HUD();
  const slimes = buildSlimes(scene, textures, world.slimeSpawns);
  const nag = new Nag(scene);

  let started = false;
  const screens = new Screens({
    onStart: () => {
      started = true;
      hud.setObjective('🎯 Anmeldung: find a flat, then bring your passport + documents to the Bürgeramt.');
      hud.setDay(1, DAY_TIMER.deadlineDay);
      hud.setFrustration(0, FRUSTRATION.max);
      hud.toast('🚆 You step off the train in Nuremberg. → Move with WASD.');
    },
  });

  nag.onSpawn = () => hud.toast('📮 ' + NAG_LINES.spawn);
  nag.onLeave = (m) => hud.toast('📮 ' + m);

  window.__game = { player, camera, world, screens }; // debug handle

  camera.position.x = player.pos.x;
  camera.position.y = player.pos.y;

  // --- game state ---
  let frustration = 0;
  let hitCooldown = 0;
  let playTime = 0;
  let curDay = 1;
  let lateWarned = false;
  let registered = false;
  let pendingWin = false;
  let ventHintShown = false;
  let flatClaimed = false;

  const clock = new THREE.Clock();
  let elapsed = 0;

  function addFrustration(amount) {
    frustration = Math.min(FRUSTRATION.max, frustration + amount);
    if (!ventHintShown) {
      ventHintShown = true;
      hud.toast('😤 Frustration rising. Find a tree and press F to vent.');
    }
  }

  function grantItems(ids) {
    for (const id of ids) {
      const it = GRANTED[id];
      hud.addItem(it);
      if (it.fact) screens.queueFact(it.fact);
    }
  }

  function collect(item) {
    item.collected = true;
    item.mesh.removeFromParent();
    hud.addItem(item);
    if (item.fact) screens.queueFact(item.fact);
  }

  function interactNpc(npc) {
    if (npc.id === 'hostel') {
      screens.startDialogue(DIALOGUES.hostel.speaker, DIALOGUES.hostel.lines);
    } else if (npc.id === 'apartment') {
      if (flatClaimed) {
        hud.toast('🏠 The flat is already yours. Off to the Bürgeramt!');
        return;
      }
      const d = DIALOGUES.apartment;
      screens.startDialogue(d.speaker, d.lines, () => {
        flatClaimed = true;
        grantItems(d.grants);
      });
    } else if (npc.goal) {
      const hasAll = REQUIRED_FOR_ANMELDUNG.every((id) => hud.hasItem(id));
      if (hasAll) {
        const d = DIALOGUES.buergeramt_complete;
        screens.startDialogue(d.speaker, d.lines, () => {
          grantItems(d.grants); // queues the Meldebescheinigung fact card
          registered = true;
          pendingWin = true; // win screen shows once that card is dismissed
          hud.setObjective('✅ Registered! You are official in Nuremberg.');
        });
      } else {
        const d = DIALOGUES.buergeramt_incomplete;
        screens.startDialogue(d.speaker, d.lines);
      }
    }
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

    // Show the win screen once the final Meldebescheinigung fact card is dismissed.
    if (pendingWin && !screens.blocking()) {
      pendingWin = false;
      screens.showWon(hud.items);
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

      // Slimes.
      hitCooldown = Math.max(0, hitCooldown - dt);
      for (const s of slimes) {
        s.update(dt);
        if (hitCooldown === 0) {
          const d = Math.hypot(s.pos.x - player.pos.x, s.pos.y - player.pos.y);
          if (d < 16) {
            hitCooldown = FRUSTRATION.hitCooldown;
            addFrustration(FRUSTRATION.perSlimeHit);
            hud.toast('🟢 Red tape! Conflicting information! (+frustration)');
          }
        }
      }

      // Nag: Rundfunkbeitrag Man.
      const nagResult = nag.update(dt, world, player, false);
      if (nagResult === 'caught') {
        addFrustration(FRUSTRATION.perNagCaught);
        hud.toast('📮 ' + NAG_LINES.caught);
        screens.queueFact('rundfunk');
        nag.despawn();
      } else if (nagResult === 'fled') {
        nag.despawn(NAG_LINES.fled);
      }

      // Passive frustration decay.
      frustration = Math.max(0, frustration - 4 * dt);
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
          if (target.npc.id === 'hostel') prompt = '<b>E</b> — Talk to the hostel clerk';
          else if (target.npc.id === 'apartment') prompt = flatClaimed ? null : '<b>E</b> — Ask about the flat';
          else if (target.npc.goal) prompt = '<b>E</b> — Enter the Bürgeramt';
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
