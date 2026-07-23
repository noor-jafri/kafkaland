import { DEFAULT_AUDIO_PREFERENCES } from './core.js';

const CHANNELS = Object.freeze([
  ['master', 'Master'],
  ['music', 'Music'],
  ['ambience', 'Ambience'],
  ['effects', 'Effects'],
]);

export class AudioSettingsPanel {
  constructor(gameAudio, options = {}) {
    this.audio = gameAudio;
    this.document = options.documentRef || document;
    this.root = this.document.getElementById('audio-settings');
    this.window = this.root.querySelector('.audio-settings-window');
    this.toggle = this.document.getElementById('audio-settings-toggle');
    this.closeButton = this.document.getElementById('audio-settings-close');
    this.enableButton = this.document.getElementById('audio-enable');
    this.masterMute = this.document.getElementById('audio-master-mute');
    this.resetButton = this.document.getElementById('audio-reset');
    this.mixer = this.document.getElementById('audio-settings-mixer');
    this.status = this.document.getElementById('audio-status');
    this.opened = false;
    this.lastFocus = null;

    this.#renderMixer();
    this.toggle.addEventListener('click', () => this.open());
    this.closeButton.addEventListener('click', () => this.close());
    this.root.querySelector('.audio-settings-shade').addEventListener('click', () => this.close());
    this.enableButton.addEventListener('click', async () => {
      await this.audio.unlockFromGesture();
      this.#sync(this.audio.getDiagnostics());
    });
    this.masterMute.addEventListener('click', () => {
      const preferences = this.audio.getPreferences();
      this.audio.setMuted(!preferences.muted);
      this.audio.emit('ui-confirm', { gain: 0.45 });
    });
    this.resetButton.addEventListener('click', () => {
      for (const [channel] of CHANNELS) {
        this.audio.setVolume(channel, DEFAULT_AUDIO_PREFERENCES.volumes[channel]);
        this.audio.setChannelMuted(channel, false);
      }
      this.audio.emit('ui-confirm', { gain: 0.5 });
    });

    this.keyHandler = (event) => this.#handleKey(event);
    this.document.addEventListener('keydown', this.keyHandler, true);
    this.unsubscribe = this.audio.subscribe((state) => this.#sync(state));
  }

  isOpen() {
    return this.opened;
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.lastFocus = this.document.activeElement;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.toggle.setAttribute('aria-expanded', 'true');
    this.audio.emit('settings-open');
    this.closeButton.focus();
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.toggle.setAttribute('aria-expanded', 'false');
    this.audio.emit('settings-close');
    const returnTarget = this.lastFocus?.isConnected ? this.lastFocus : this.toggle;
    returnTarget.focus?.();
  }

  dispose() {
    this.unsubscribe?.();
    this.document.removeEventListener('keydown', this.keyHandler, true);
  }

  #renderMixer() {
    const fragment = this.document.createDocumentFragment();
    for (const [channel, label] of CHANNELS) {
      const row = this.document.createElement('div');
      row.className = 'audio-channel';
      row.dataset.channel = channel;
      row.innerHTML = `
        <div class="audio-channel-heading">
          <label for="audio-volume-${channel}">${label}</label>
          <output for="audio-volume-${channel}">0%</output>
        </div>
        <div class="audio-channel-controls">
          <input id="audio-volume-${channel}" type="range" min="0" max="1" step="0.01" aria-label="${label} volume" />
          <button type="button" class="audio-channel-mute" aria-pressed="false">Mute</button>
        </div>`;
      const slider = row.querySelector('input');
      const mute = row.querySelector('button');
      slider.addEventListener('input', () => {
        this.audio.setVolume(channel, Number(slider.value));
      });
      slider.addEventListener('change', () => this.audio.emit('ui-select', { gain: 0.35 }));
      mute.addEventListener('click', () => {
        const preferences = this.audio.getPreferences();
        const currentlyMuted = channel === 'master'
          ? preferences.muted
          : preferences.channelMutes[channel];
        this.audio.setChannelMuted(channel, !currentlyMuted);
        this.audio.emit('ui-confirm', { gain: 0.4 });
      });
      fragment.append(row);
    }
    this.mixer.replaceChildren(fragment);
  }

  #sync(state) {
    const preferences = state.preferences;
    for (const [channel, label] of CHANNELS) {
      const row = this.mixer.querySelector(`[data-channel="${channel}"]`);
      const value = preferences.volumes[channel];
      const muted = channel === 'master' ? preferences.muted : preferences.channelMutes[channel];
      const slider = row.querySelector('input');
      const output = row.querySelector('output');
      const button = row.querySelector('button');
      slider.value = value;
      slider.style.setProperty('--audio-fill', `${value * 100}%`);
      output.value = `${Math.round(value * 100)}%`;
      button.setAttribute('aria-pressed', String(muted));
      button.setAttribute('aria-label', `${muted ? 'Unmute' : 'Mute'} ${label}`);
      button.textContent = muted ? 'Unmute' : 'Mute';
      row.classList.toggle('is-muted', muted);
    }

    this.masterMute.setAttribute('aria-pressed', String(preferences.muted));
    this.masterMute.textContent = preferences.muted ? 'Unmute all sound' : 'Mute all sound';
    this.toggle.classList.toggle('is-muted', preferences.muted);
    const statusLabels = {
      locked: 'Sound waits for your first click or key press.',
      running: 'Sound is ready.',
      suspended: this.document.hidden ? 'Sound is paused while this tab is hidden.' : 'Sound is paused.',
      interrupted: 'Sound was interrupted. Use Enable audio to resume.',
      closed: 'Sound is unavailable.',
    };
    this.status.textContent = state.lastError || statusLabels[state.state] || `Audio: ${state.state}`;
    this.status.classList.toggle('is-error', Boolean(state.lastError));
    this.enableButton.textContent = state.state === 'running' ? 'Audio enabled' : 'Enable audio';
    this.enableButton.disabled = state.state === 'running';
  }

  #handleKey(event) {
    const inTextField = event.target instanceof Element
      && Boolean(event.target.closest('input:not([type="range"]), textarea, select, [contenteditable="true"]'));
    if (!this.opened && event.code === 'KeyM' && !inTextField && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.open();
      return;
    }
    if (!this.opened) return;
    if (event.key === 'Escape' || (event.code === 'KeyM' && !inTextField)) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...this.window.querySelectorAll('button:not([disabled]), input:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
