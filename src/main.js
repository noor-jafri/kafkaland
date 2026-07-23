import * as THREE from 'three';
import { CAMERA_ZOOM, INTERACT_RADIUS, FRUSTRATION, DAY_TIMER } from './config.js';
import { loadAll } from './textures.js';
import { buildWorld, surfaceAt } from './world.js';
import { Player } from './player.js';
import { HUD } from './ui.js';
import { Screens } from './screens.js';
import { CompanionPanel } from './companion.js';
import { GameAudio } from './audio/game-audio.js';
import { AudioSettingsPanel } from './audio/settings.js';
import { buildSlimes } from './enemies.js';
import { Nag } from './nag.js';
import { wasPressed, endFrame } from './input.js';
import { DIALOGUES, NAG_LINES, VENT_LINES } from './content.js';
import { REQUIRED_FOR_ANMELDUNG } from './map.js';

function cameraCenterFor(value, viewSize, minimum, maximum) {
  if (maximum - minimum <= viewSize) return (minimum + maximum) / 2;
  return Math.max(minimum + viewSize / 2, Math.min(maximum - viewSize / 2, value));
}

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
  const world = buildWorld(scene, textures);
  const player = new Player(scene, textures, world.playerStart);
  const hud = new HUD();
  const companion = new CompanionPanel({ onAudioEvent: (name, detail) => gameAudio.emit(name, detail) });
  const slimes = buildSlimes(scene, textures, world.slimeSpawns);
  const nag = new Nag(scene);

  let started = false;
  const screens = new Screens({
    onAudioEvent: (name, detail) => gameAudio.emit(name, detail),
    onStart: () => {
      started = true;
      gameAudio.startGame();
      gameAudio.setDeadlineProgress(1, DAY_TIMER.deadlineDay);
      hud.setObjective('🎯 Anmeldung: find a flat, then bring your passport + documents to the Bürgeramt.');
      hud.setDay(1, DAY_TIMER.deadlineDay);
      hud.setFrustration(0, FRUSTRATION.max);
      hud.toast('🚆 You step off the train in Nuremberg. → Move with WASD.');
      companion.prepare();
    },
  });

  nag.onSpawn = () => {
    gameAudio.emit('mail-delivery');
    hud.toast('📮 ' + NAG_LINES.spawn);
  };
  nag.onLeave = (m) => hud.toast('📮 ' + m);

  window.__game = {
    player,
    camera,
    world,
    screens,
    companion,
    audio: gameAudio,
    audioSettings,
  }; // debug handle
  window.addEventListener('beforeunload', () => {
    audioSettings.dispose();
    gameAudio.dispose();
  }, { once: true });

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
    gameAudio.emit('frustration-increase');
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
    gameAudio.emit('document-pickup');
    hud.addItem(item);
    if (item.fact) screens.queueFact(item.fact);
  }

  function interactNpc(npc) {
    if (npc.id === 'companion') {
      companion.open();
    } else if (npc.id === 'hostel') {
      gameAudio.emit('building-enter');
      screens.startDialogue(DIALOGUES.hostel.speaker, DIALOGUES.hostel.lines);
    } else if (npc.id === 'apartment') {
      if (flatClaimed) {
        gameAudio.emit('npc-interaction');
        hud.toast('🏠 The flat is already yours. Off to the Bürgeramt!');
        return;
      }
      gameAudio.emit('building-enter');
      const d = DIALOGUES.apartment;
      screens.startDialogue(d.speaker, d.lines, () => {
        flatClaimed = true;
        grantItems(d.grants);
        companion.recordProgress('complete_housing');
      });
    } else if (npc.goal) {
      const hasAll = REQUIRED_FOR_ANMELDUNG.every((id) => hud.hasItem(id));
      gameAudio.emit('building-enter');
      if (hasAll) {
        const d = DIALOGUES.buergeramt_complete;
        screens.startDialogue(d.speaker, d.lines, () => {
          gameAudio.emit('rubber-stamp');
          grantItems(d.grants); // queues the Meldebescheinigung fact card
          registered = true;
          companion.recordProgress('complete_level_1');
          pendingWin = true; // win screen shows once that card is dismissed
          hud.setObjective('✅ Registered! You are official in Nuremberg.');
        });
      } else {
        gameAudio.emit('missing-document');
        gameAudio.emit('quest-failure', { gain: 0.55 });
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
    const wasBlocking = screens.blocking() || companion.isOpen() || audioSettings.isOpen();
    if (!companion.isOpen() && !audioSettings.isOpen()) screens.update();

    // Show the win screen once the final Meldebescheinigung fact card is dismissed.
    if (pendingWin && !screens.blocking()) {
      pendingWin = false;
      screens.showWon(hud.items);
    }

    const frozen = wasBlocking || !started;
    player.update(dt, world, frozen);

    // Camera follows the player while keeping edge canopies inside the view.
    const viewW = camera.right - camera.left;
    const viewH = camera.top - camera.bottom;
    const cx = cameraCenterFor(player.pos.x, viewW, world.visualBounds.minX, world.visualBounds.maxX);
    const cy = cameraCenterFor(player.pos.y, viewH, world.visualBounds.minY, world.visualBounds.maxY);
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
            gameAudio.emit('slime-collision');
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
        gameAudio.emit('tree-vent');
        frustration = Math.max(0, frustration - FRUSTRATION.ventDrain);
        hud.setFrustration(frustration, FRUSTRATION.max);
        hud.toast(VENT_LINES[Math.floor(Math.random() * VENT_LINES.length)]);
        tree._shake = 0.25;
      }
      for (const t of world.trees) {
        if (t._shake > 0) {
          t._shake = Math.max(0, t._shake - dt);
          t.mesh.position.x = t.restX + Math.sin(elapsed * 60) * 1.2;
        } else {
          t.mesh.position.x = t.restX;
        }
      }

      // Contextual interact prompt + E handling.
      let prompt = null;
      if (nag.isNear(player)) {
        prompt = '<b>E</b> — Pay the Rundfunkbeitrag (make him leave)';
      } else {
        const target = nearestTarget();
        if (target?.kind === 'doc') prompt = `<b>E</b> - Pick up ${target.item.name}`;
        else if (target?.kind === 'npc') {
          if (target.npc.id === 'companion') prompt = '<b>E</b> - Ask Marlene, the Amts-Eule';
          else if (target.npc.id === 'hostel') prompt = '<b>E</b> - Talk to the hostel clerk';
          else if (target.npc.id === 'apartment') prompt = flatClaimed ? null : '<b>E</b> - Ask about the flat';
          else if (target.npc.goal) prompt = '<b>E</b> - Enter the Bürgeramt';
        }
      }
      if (!prompt && tree) prompt = '<b>F</b> — punch the tree (vent)';
      hud.showPrompt(prompt);

      if (wasPressed('KeyE')) {
        if (nag.isNear(player)) {
          gameAudio.emit('paper-rustle');
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

    gameAudio.update(dt, {
      active: started && !frozen && !registered,
      moving: player.moving,
      surface: surfaceAt(world, player.pos.x, player.pos.y),
      slimeNearby: slimes.some((slime) => Math.hypot(
        slime.pos.x - player.pos.x,
        slime.pos.y - player.pos.y
      ) < 120),
    });

    renderer.render(scene, camera);
    endFrame();
  }
  frame();
}

start();
