import { citationLabel, inputLimitFor, submissionSummary } from './companion-format.js';

const API_ROOT = '/api/companion';

async function responseJson(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The companion service returned an unreadable response.');
  }
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'The companion service is unavailable.');
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class CompanionPanel {
  constructor({ onClose, onAudioEvent } = {}) {
    this.root = document.getElementById('companion');
    this.window = this.root.querySelector('.companion-window');
    this.messages = document.getElementById('companion-messages');
    this.empty = document.getElementById('companion-empty');
    this.form = document.getElementById('companion-form');
    this.input = document.getElementById('companion-input');
    this.submit = document.getElementById('companion-submit');
    this.closeButton = document.getElementById('companion-close');
    this.count = document.getElementById('companion-count');
    this.level = document.getElementById('companion-level');
    this.letterWarning = document.getElementById('letter-warning');
    this.modeHint = document.getElementById('companion-mode-hint');
    this.tabs = [...this.root.querySelectorAll('[role="tab"]')];
    this.mode = 'ask';
    this.opened = false;
    this.loading = false;
    this.abortController = null;
    this.sessionPromise = null;
    this.progressQueue = Promise.resolve();
    this.onClose = onClose;
    this.onAudioEvent = onAudioEvent;
    this.lastFocus = null;

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#submit();
    });
    this.input.addEventListener('input', () => this.#updateCount());
    this.input.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });
    this.closeButton.addEventListener('click', () => this.close());
    for (const tab of this.tabs) tab.addEventListener('click', () => this.#setMode(tab.dataset.mode));
    for (const suggestion of this.root.querySelectorAll('[data-suggestion]')) {
      suggestion.addEventListener('click', () => {
        this.#setMode('ask');
        this.onAudioEvent?.('ui-select', { gain: 0.45 });
        this.input.value = suggestion.dataset.suggestion;
        this.#updateCount();
        this.input.focus();
      });
    }
    this.root.addEventListener('keydown', (event) => this.#handleDialogKey(event));
    this.root.querySelector('.companion-shade').addEventListener('click', () => this.close());
    this.#setMode('ask');
  }

  isOpen() {
    return this.opened;
  }

  async prepare() {
    try {
      return await this.#ensureSession();
    } catch {
      return null;
    }
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.lastFocus = document.activeElement;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.onAudioEvent?.('companion-open');
    this.input.focus();
    this.#ensureSession()
      .then(() => this.recordProgress('discover_companion'))
      .catch(() => this.#showServiceNotice('Marlene cannot reach the records room. Check that the companion API is running.'));
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.abortController?.abort();
    this.abortController = null;
    this.loading = false;
    this.submit.disabled = false;
    this.input.value = '';
    this.#updateCount();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    const returnTarget = this.lastFocus?.isConnected ? this.lastFocus : document.querySelector('canvas');
    returnTarget?.focus?.();
    this.onAudioEvent?.('companion-close');
    this.onClose?.();
  }

  recordProgress(action) {
    this.progressQueue = this.progressQueue.then(async () => {
      const payload = await this.#post('/progress', { action });
      this.#showProgress(payload.progress);
      return payload.progress;
    }).catch(() => {
      this.#showServiceNotice('Progress sync paused. Your game continues, but new guidance may stay locked.');
      return null;
    });
    return this.progressQueue;
  }

  async #ensureSession() {
    if (!this.sessionPromise) {
      this.sessionPromise = fetch(`${API_ROOT}/session`, { credentials: 'same-origin' })
        .then(responseJson)
        .then((payload) => {
          this.#showProgress(payload.progress);
          return payload.progress;
        })
        .catch((error) => {
          this.sessionPromise = null;
          throw error;
        });
    }
    return this.sessionPromise;
  }

  #showProgress(progress) {
    if (!progress) return;
    this.level.textContent = `LEVEL ${progress.currentLevel} FILES`;
  }

  async #post(path, body, signal) {
    await this.#ensureSession();
    const send = () => fetch(`${API_ROOT}${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    let response = await send();
    if (response.status === 401) {
      this.sessionPromise = null;
      await this.#ensureSession();
      response = await send();
    }
    return responseJson(response);
  }

  #setMode(mode) {
    if (!['ask', 'letter'].includes(mode)) return;
    const changed = this.mode !== mode;
    this.mode = mode;
    if (changed) this.onAudioEvent?.('ui-select', { gain: 0.42 });
    for (const tab of this.tabs) {
      const selected = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    const letter = mode === 'letter';
    this.letterWarning.classList.toggle('hidden', !letter);
    this.input.maxLength = inputLimitFor(mode);
    this.input.placeholder = letter
      ? 'Paste German letter text here... / Deutschen Brieftext hier einfügen...'
      : 'Ask in English oder auf Deutsch...';
    this.input.setAttribute('aria-describedby', letter ? 'letter-warning companion-mode-hint' : 'companion-mode-hint');
    this.modeHint.textContent = letter
      ? 'Text only. Images and PDFs are not read. Ctrl/⌘ + Enter to explain.'
      : 'Answers use only your unlocked files. Ctrl/⌘ + Enter to send.';
    this.submit.querySelector('.submit-label').textContent = letter ? 'Explain letter' : 'Ask Marlene';
    this.input.value = '';
    this.#updateCount();
  }

  #updateCount() {
    this.count.textContent = `${this.input.value.length.toLocaleString()} / ${inputLimitFor(this.mode).toLocaleString()}`;
  }

  #handleDialogKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.target.matches?.('[role="tab"]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const current = this.tabs.indexOf(event.target);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = this.tabs[(current + direction + this.tabs.length) % this.tabs.length];
      this.#setMode(next.dataset.mode);
      next.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...this.window.querySelectorAll('button:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
      .filter((node) => !node.closest('.hidden'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async #submit() {
    if (this.loading) return;
    const input = this.input.value;
    if (!input.trim()) {
      this.onAudioEvent?.('locked-feedback', { gain: 0.5 });
      this.input.focus();
      return;
    }
    const mode = this.mode;
    this.empty.classList.add('hidden');
    this.#appendUser(submissionSummary(mode, input), mode);
    this.input.value = '';
    this.#updateCount();
    this.loading = true;
    this.submit.disabled = true;
    this.abortController = new AbortController();
    this.onAudioEvent?.('companion-thinking');
    const loadingMessage = this.#appendLoading(mode);

    try {
      const payload = await this.#post('/messages', { mode, input }, this.abortController.signal);
      loadingMessage.remove();
      this.#appendAnswer(payload);
    } catch (error) {
      loadingMessage.remove();
      if (error.name !== 'AbortError') this.#appendError(error.message);
    } finally {
      this.loading = false;
      this.submit.disabled = false;
      this.abortController = null;
      if (this.opened) this.input.focus();
    }
  }

  #appendUser(summary, mode) {
    const article = element('article', 'companion-message companion-message-user');
    article.setAttribute('aria-label', mode === 'letter' ? 'Your private letter request' : 'Your question');
    article.append(element('div', 'message-kicker', mode === 'letter' ? 'SEALED LETTER' : 'YOU'));
    article.append(element('p', '', summary));
    this.messages.append(article);
    this.#scrollMessages();
  }

  #appendLoading(mode) {
    const article = element('article', 'companion-message companion-message-assistant companion-loading');
    article.setAttribute('role', 'status');
    article.setAttribute('aria-label', 'Marlene is checking unlocked files');
    const dots = element('div', 'loading-dots');
    for (let i = 0; i < 3; i++) dots.append(element('span'));
    article.append(element('div', 'message-kicker', 'MARLENE CHECKS THE FILES'), dots, element('p', 'loading-copy', mode === 'letter' ? 'Reading this once. Kafkaland does not save it.' : 'Searching only what you have unlocked.'));
    this.messages.append(article);
    this.#scrollMessages();
    return article;
  }

  #appendAnswer(payload) {
    this.onAudioEvent?.(payload.type === 'locked' ? 'companion-locked' : 'companion-answer');
    const article = element('article', `companion-message companion-message-assistant response-${payload.type}`);
    article.append(element('div', 'message-kicker', payload.type === 'locked' ? 'SEALED FILE' : 'MARLENE · AMTS-EULE'));
    article.append(element('p', 'answer-copy', payload.answer));

    if (payload.type === 'letter') {
      article.append(this.#warning(payload.warning));
      article.append(this.#itemList('Explicit deadlines', payload.deadlines, 'No explicit deadline found in the pasted text.'));
      article.append(this.#itemList('Requested actions', payload.actions, 'No explicit requested action found in the pasted text.'));
    }
    if (payload.citations?.length) article.append(this.#citations(payload.citations));
    this.messages.append(article);
    this.#scrollMessages();
  }

  #warning(text) {
    const warning = element('div', 'answer-warning');
    warning.setAttribute('role', 'note');
    warning.append(element('strong', '', '⚠ NOT LEGAL ADVICE · CHECK CURRENT INFORMATION'), element('p', '', text));
    return warning;
  }

  #itemList(title, items = [], emptyText) {
    const section = element('section', 'letter-findings');
    section.append(element('h4', '', title));
    if (!items.length) {
      section.append(element('p', 'finding-empty', emptyText));
      return section;
    }
    const list = element('ul');
    for (const item of items) {
      const row = element('li');
      row.append(element('div', 'finding-text', item.text), element('blockquote', '', `“${item.evidenceQuote}”`));
      list.append(row);
    }
    section.append(list);
    return section;
  }

  #citations(citations) {
    const section = element('section', 'companion-citations');
    section.append(element('h4', '', 'Unlocked sources'));
    const list = element('ol');
    for (const citation of citations) {
      const item = element('li');
      const marker = element('span', 'citation-marker', citation.id);
      const details = element('div');
      details.append(element('strong', '', citationLabel(citation)), element('code', '', citation.path));
      item.append(marker, details);
      list.append(item);
    }
    section.append(list);
    return section;
  }

  #appendError(message) {
    this.onAudioEvent?.('companion-error');
    const article = element('article', 'companion-message companion-error');
    article.setAttribute('role', 'alert');
    article.append(element('div', 'message-kicker', 'RECORDS ROOM CLOSED'), element('p', '', message));
    const button = element('button', 'inline-retry', 'Return to the form');
    button.type = 'button';
    button.addEventListener('click', () => this.input.focus());
    article.append(button);
    this.messages.append(article);
    this.#scrollMessages();
  }

  #showServiceNotice(message) {
    if (!this.opened) return;
    const existing = this.root.querySelector('.service-notice');
    if (existing) {
      existing.textContent = message;
      return;
    }
    const notice = element('div', 'service-notice', message);
    notice.setAttribute('role', 'status');
    this.window.prepend(notice);
  }

  #scrollMessages() {
    requestAnimationFrame(() => {
      this.messages.scrollTop = this.messages.scrollHeight;
    });
  }
}
