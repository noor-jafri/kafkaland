import {
  AudioManager,
  DEFAULT_AUDIO_PREFERENCES,
  TRACK_DEFINITIONS,
} from './index.js';

const TRACK_PRESENTATION = Object.freeze({
  'cozy-exploration': { number: 'A1', detail: 'Warm pads and felt-like plucks', icon: '⌂' },
  'bureaucracy-office': { number: 'A2', detail: 'Paper pulse with an orderly bounce', icon: '▤' },
  'companion-calm': { number: 'B1', detail: 'Slow glass tones and a soft air bed', icon: '✦' },
  'deadline-pressure': { number: 'C1', detail: 'Sparse low pulse, deliberately restrained', icon: '◷' },
});

const EFFECT_GROUPS = Object.freeze([
  {
    title: 'Steps and movement', icon: '⌁',
    effects: [
      ['footstep-grass', 'Grass'], ['footstep-path', 'Path'], ['footstep-wood', 'Wood'],
      ['footstep-tile', 'Tile'], ['slime', 'Slime'],
    ],
  },
  {
    title: 'Paperwork and objects', icon: '▤',
    effects: [
      ['paper-rustle', 'Paper'], ['rubber-stamp', 'Stamp'], ['typewriter-tick', 'Typewriter'],
      ['mailbox', 'Mailbox'], ['door-open', 'Door open'], ['door-close', 'Door close'],
    ],
  },
  {
    title: 'Interface and quests', icon: '◇',
    effects: [
      ['interaction', 'Interact'], ['ui-move', 'UI move'], ['ui-confirm', 'Confirm'],
      ['ui-cancel', 'Cancel'], ['quest-unlock', 'Quest unlock'], ['locked', 'Locked'],
      ['missing-document', 'Missing document'],
    ],
  },
  {
    title: 'Companion', icon: '✦',
    effects: [
      ['companion-activation', 'Activation'], ['companion-thinking', 'Thinking'],
      ['companion-answer', 'Answer'], ['companion-error', 'Error'],
    ],
  },
  {
    title: 'Emotion and release', icon: '◌',
    effects: [
      ['frustration', 'Frustration'], ['tree-vent', 'Tree vent'],
    ],
  },
  {
    title: 'Environmental accents', icon: '⌇',
    effects: [
      ['environment-breeze', 'Breeze'], ['environment-bird', 'Bird'],
      ['environment-room', 'Office room'],
    ],
  },
]);

const CHANNEL_PRESENTATION = Object.freeze({
  master: { label: 'Master', icon: '◆' },
  music: { label: 'Music', icon: '♫' },
  ambience: { label: 'Ambience', icon: '≈' },
  effects: { label: 'Effects', icon: '✦' },
});

const SLOT_IDS = Object.freeze(['music-main', 'companion-ambience', 'pressure-layer']);
const audio = new AudioManager({ onError: (error) => logMessage(error.message || String(error), true) });
audio.restorePreferences();

let demoTimer = null;
let dialogueDucking = false;
let companionDucking = false;

const unlockButton = document.querySelector('#unlock-audio');
const unlockPanel = document.querySelector('#unlock-panel');
const contextState = document.querySelector('#context-state');
const contextDot = document.querySelector('#context-dot');
const trackGrid = document.querySelector('#track-grid');
const mixer = document.querySelector('#mixer');
const effectGroups = document.querySelector('#effect-groups');
const meter = document.querySelector('#meter');
const logList = document.querySelector('#session-log');
const demoButton = document.querySelector('#crossfade-demo');
const demoCopy = document.querySelector('#demo-copy');

renderTracks();
renderMixer();
renderEffects();
renderActiveTracks();
renderDucking();
renderContextState();
logMessage('Sound desk ready. Unlock audio to begin.');

unlockButton.addEventListener('click', async () => {
  unlockButton.disabled = true;
  try {
    await audio.unlock();
    audio.playEffect('ui-confirm', { gain: 0.55 });
    logMessage('AudioContext unlocked by explicit gesture.');
  } catch (error) {
    logMessage(error.message || String(error), true);
  } finally {
    unlockButton.disabled = false;
    renderContextState();
  }
});

document.querySelector('#stop-all').addEventListener('click', () => {
  cancelDemo();
  audio.stopAllTracks({ fadeSeconds: 0.7 });
  renderActiveTracks();
  logMessage('All procedural tracks fading out.');
});

demoButton.addEventListener('click', () => {
  if (!requireUnlocked()) return;
  cancelDemo();
  audio.playTrack('cozy-exploration', { fadeSeconds: 0.55 });
  renderActiveTracks();
  demoButton.textContent = 'Exploration playing';
  demoCopy.textContent = 'Listen for the warm exploration bed. Office enters in 3 seconds.';
  logMessage('Crossfade demo started with Cozy exploration.');
  demoTimer = window.setTimeout(() => {
    audio.playTrack('bureaucracy-office', { fadeSeconds: 2.2 });
    renderActiveTracks();
    demoButton.textContent = 'Run A/B demo';
    demoCopy.textContent = 'Equal slot handoff complete. Replay whenever you like.';
    logMessage('Crossfaded into Playful bureaucracy office over 2.2 seconds.');
    demoTimer = null;
  }, 3000);
});

document.querySelector('#reset-mix').addEventListener('click', () => {
  for (const channel of Object.keys(CHANNEL_PRESENTATION)) {
    audio.setVolume(channel, DEFAULT_AUDIO_PREFERENCES.volumes[channel], { fadeSeconds: 0.2 });
    audio.setChannelMuted(channel, false, { fadeSeconds: 0.2 });
  }
  audio.persistPreferences();
  syncMixer();
  logMessage('Mixer restored to the quiet default balance.');
});

document.querySelector('#duck-dialogue').addEventListener('click', () => {
  dialogueDucking = !dialogueDucking;
  audio.setDialogueActive(dialogueDucking);
  renderDucking();
  logMessage(`Dialogue ducking ${dialogueDucking ? 'engaged' : 'released'}.`);
});

document.querySelector('#duck-companion').addEventListener('click', () => {
  companionDucking = !companionDucking;
  audio.setCompanionActive(companionDucking);
  renderDucking();
  logMessage(`Companion ducking ${companionDucking ? 'engaged' : 'released'}.`);
});

document.querySelector('#clear-log').addEventListener('click', () => {
  logList.replaceChildren();
  renderEmptyLog();
});

document.addEventListener('visibilitychange', () => {
  window.setTimeout(() => {
    renderContextState();
    logMessage(document.hidden ? 'Hidden tab suspended audio.' : 'Visible tab resumed audio.');
  }, 0);
});

window.setInterval(renderContextState, 500);
window.addEventListener('beforeunload', () => audio.dispose());

// Intentional diagnostic handle for the audition page only.
window.__kafkalandAudioDesk = audio;

function renderTracks() {
  const fragment = document.createDocumentFragment();
  for (const [id, track] of Object.entries(TRACK_DEFINITIONS)) {
    const presentation = TRACK_PRESENTATION[id];
    const card = document.createElement('article');
    card.className = 'track-card';
    card.dataset.trackId = id;
    card.innerHTML = `
      <div class="track-meta">
        <span class="track-number">${presentation.number} / ${presentation.icon}</span>
        <span class="track-tag">${track.channel}</span>
      </div>
      <div class="track-bottom">
        <div>
          <h3>${track.label}</h3>
          <p>${presentation.detail}</p>
        </div>
        <div class="track-actions">
          <button class="track-action play" type="button" aria-label="Play ${track.label}" title="Play">▶</button>
          <button class="track-action stop" type="button" aria-label="Stop ${track.label}" title="Stop">■</button>
        </div>
      </div>`;
    card.querySelector('.play').addEventListener('click', () => playTrack(id));
    card.querySelector('.stop').addEventListener('click', () => stopTrack(id));
    fragment.append(card);
  }
  trackGrid.replaceChildren(fragment);
}

function renderMixer() {
  const preferences = audio.getPreferences();
  const fragment = document.createDocumentFragment();
  for (const [channel, presentation] of Object.entries(CHANNEL_PRESENTATION)) {
    const value = preferences.volumes[channel];
    const muted = channel === 'master' ? preferences.muted : preferences.channelMutes[channel];
    const row = document.createElement('div');
    row.className = `channel${muted ? ' is-muted' : ''}`;
    row.dataset.channel = channel;
    row.innerHTML = `
      <div class="channel-top">
        <span class="channel-name"><span aria-hidden="true">${presentation.icon}</span>${presentation.label}</span>
        <output class="channel-value" for="volume-${channel}">${Math.round(value * 100)}</output>
      </div>
      <div class="channel-control">
        <input id="volume-${channel}" type="range" min="0" max="1" step="0.01" value="${value}"
          aria-label="${presentation.label} volume" style="--fill: ${value * 100}%" />
        <button class="mute-button" type="button" aria-label="Mute ${presentation.label}"
          aria-pressed="${muted}" title="Mute ${presentation.label}">◖</button>
      </div>`;
    const slider = row.querySelector('input');
    const muteButton = row.querySelector('.mute-button');
    slider.addEventListener('input', () => {
      const next = Number(slider.value);
      audio.setVolume(channel, next);
      row.querySelector('output').value = Math.round(next * 100);
      slider.style.setProperty('--fill', `${next * 100}%`);
      audio.persistPreferences();
    });
    slider.addEventListener('change', () => {
      logMessage(`${presentation.label} volume set to ${Math.round(Number(slider.value) * 100)}%.`);
    });
    muteButton.addEventListener('click', () => {
      const next = muteButton.getAttribute('aria-pressed') !== 'true';
      audio.setChannelMuted(channel, next);
      audio.persistPreferences();
      syncMixer();
      logMessage(`${presentation.label} ${next ? 'muted' : 'unmuted'}.`);
    });
    fragment.append(row);
  }
  mixer.replaceChildren(fragment);
}

function syncMixer() {
  const preferences = audio.getPreferences();
  for (const channel of Object.keys(CHANNEL_PRESENTATION)) {
    const row = mixer.querySelector(`[data-channel="${channel}"]`);
    const value = preferences.volumes[channel];
    const muted = channel === 'master' ? preferences.muted : preferences.channelMutes[channel];
    const slider = row.querySelector('input');
    slider.value = value;
    slider.style.setProperty('--fill', `${value * 100}%`);
    row.querySelector('output').value = Math.round(value * 100);
    row.querySelector('.mute-button').setAttribute('aria-pressed', String(muted));
    row.classList.toggle('is-muted', muted);
  }
}

function renderEffects() {
  const fragment = document.createDocumentFragment();
  for (const group of EFFECT_GROUPS) {
    const section = document.createElement('section');
    section.className = 'effect-group';
    const heading = document.createElement('h3');
    heading.innerHTML = `<span aria-hidden="true">${group.icon}</span>${group.title}`;
    const list = document.createElement('div');
    list.className = 'effect-list';
    for (const [id, label] of group.effects) {
      const button = document.createElement('button');
      button.className = 'effect-button';
      button.type = 'button';
      button.textContent = label;
      button.dataset.effectId = id;
      button.addEventListener('click', () => triggerEffect(id, label, button));
      list.append(button);
    }
    section.append(heading, list);
    fragment.append(section);
  }
  effectGroups.replaceChildren(fragment);
}

function playTrack(id) {
  if (!requireUnlocked()) return;
  cancelDemo();
  const result = audio.playTrack(id, { fadeSeconds: 1.25 });
  renderActiveTracks();
  if (result.played) logMessage(`Playing ${TRACK_DEFINITIONS[id].label} in ${result.slot}.`);
}

function stopTrack(id) {
  cancelDemo();
  const stopped = audio.stopTrack(id, { fadeSeconds: 0.75 });
  renderActiveTracks();
  logMessage(stopped ? `Fading out ${TRACK_DEFINITIONS[id].label}.` : `${TRACK_DEFINITIONS[id].label} is already stopped.`);
}

function renderActiveTracks() {
  const activeIds = new Set();
  for (const slot of SLOT_IDS) {
    const id = audio.getActiveTrack(slot);
    if (id) activeIds.add(id);
    const readout = document.querySelector(`#slot-${slot}`);
    readout.textContent = id ? TRACK_DEFINITIONS[id].label : 'Stopped';
  }
  for (const card of trackGrid.querySelectorAll('.track-card')) {
    const active = activeIds.has(card.dataset.trackId);
    card.classList.toggle('is-active', active);
    card.querySelector('.play').setAttribute('aria-pressed', String(active));
  }
  meter.classList.toggle('is-sounding', activeIds.size > 0);
}

function triggerEffect(id, label, button) {
  if (!requireUnlocked()) return;
  const result = audio.playEffect(id);
  if (result.played) {
    button.classList.remove('is-triggered');
    requestAnimationFrame(() => button.classList.add('is-triggered'));
    window.setTimeout(() => button.classList.remove('is-triggered'), 180);
    logMessage(`Effect: ${label}.`);
  } else if (result.reason !== 'cooldown') {
    logMessage(`${label} skipped by ${result.reason} guard.`, true);
  }
}

function renderDucking() {
  const dialogueButton = document.querySelector('#duck-dialogue');
  const companionButton = document.querySelector('#duck-companion');
  dialogueButton.setAttribute('aria-pressed', String(dialogueDucking));
  companionButton.setAttribute('aria-pressed', String(companionDucking));
  const factors = audio.getDuckingFactors();
  document.querySelector('#duck-value').value = `${Math.round(factors.music * 100)}%`;
  const values = document.querySelectorAll('#duck-factors strong');
  values[0].textContent = factors.music.toFixed(2);
  values[1].textContent = factors.ambience.toFixed(2);
  values[2].textContent = factors.effects.toFixed(2);
}

function renderContextState() {
  const state = audio.state;
  const dotClass = state === 'running'
    ? 'context-dot is-running'
    : state === 'suspended' || state === 'interrupted'
      ? 'context-dot is-suspended'
      : 'context-dot';
  if (contextDot.className !== dotClass) contextDot.className = dotClass;
  const labels = {
    locked: 'Audio locked',
    running: 'Audio ready',
    suspended: document.hidden ? 'Suspended while hidden' : 'Audio suspended',
    interrupted: 'Audio interrupted',
    closed: 'Audio closed',
  };
  const label = labels[state] || `Audio ${state}`;
  if (contextState.textContent !== label) contextState.textContent = label;
  const buttonMode = audio.unlocked && state === 'running'
    ? 'unlocked'
    : audio.unlocked
      ? 'resume'
      : 'unlock';
  if (unlockButton.dataset.mode === buttonMode) return;
  unlockButton.dataset.mode = buttonMode;
  unlockButton.classList.toggle('is-unlocked', buttonMode === 'unlocked');
  const buttonLabels = {
    unlocked: '<span aria-hidden="true">✓</span> Audio unlocked',
    resume: '<span aria-hidden="true">▶</span> Resume audio',
    unlock: '<span aria-hidden="true">▶</span> Unlock audio',
  };
  unlockButton.innerHTML = buttonLabels[buttonMode];
}

function requireUnlocked() {
  if (audio.unlocked && audio.state === 'running') return true;
  unlockPanel.classList.remove('is-attention');
  requestAnimationFrame(() => unlockPanel.classList.add('is-attention'));
  unlockButton.focus();
  logMessage('Use Unlock audio before auditioning sound.', true);
  return false;
}

function cancelDemo() {
  if (demoTimer == null) return;
  window.clearTimeout(demoTimer);
  demoTimer = null;
  demoButton.textContent = 'Run A/B demo';
  demoCopy.textContent = 'Exploration smoothly hands off to the office score.';
}

function logMessage(message, warning = false) {
  logList.querySelector('.log-empty')?.remove();
  const entry = document.createElement('li');
  entry.className = `log-entry${warning ? ' is-warn' : ''}`;
  const time = document.createElement('time');
  time.dateTime = new Date().toISOString();
  time.textContent = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const copy = document.createElement('span');
  copy.textContent = message;
  entry.append(time, copy);
  logList.prepend(entry);
  while (logList.children.length > 50) logList.lastElementChild.remove();
}

function renderEmptyLog() {
  if (logList.children.length) return;
  const empty = document.createElement('li');
  empty.className = 'log-empty';
  empty.textContent = 'No session events yet.';
  logList.append(empty);
}
