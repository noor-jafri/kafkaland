import { wasPressed } from './input.js';
import { INTRO_PANELS, HOWTO, FACT_CARDS } from './content.js';

// Manages every DOM overlay: the pre-game flow (title → intro → how-to-play),
// plus in-game overlays (dialogue, fact cards, codex) and the win screen.
// main.js freezes the world whenever `blocking()` is true.
export class Screens {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.phase = 'title'; // title | intro | howto | credits | playing | won
    this.overlay = null; // null | 'dialogue' | 'factcard' | 'codex'

    this.introIndex = 0;
    this.menuIndex = 0;
    this.codexSeen = []; // ordered fact ids, for the Codex
    this.codexSet = new Set();
    this.factQueue = [];
    this.dialogue = null; // { speaker, lines, index, onDone }
    this.card = null;

    this.screenEl = document.getElementById('screen');
    this.innerEl = document.getElementById('screen-inner');
    this.dlgEl = document.getElementById('dialogue');
    this.cardEl = document.getElementById('factcard');
    this.codexEl = document.getElementById('codex');

    this.#renderTitle();
  }

  blocking() {
    return this.phase !== 'playing' || this.overlay !== null;
  }
  codexUnlocked() {
    return this.codexSet.size > 0;
  }

  // ---- Public hooks used by main.js during play ----
  queueFact(id) {
    if (!FACT_CARDS[id]) return;
    this.factQueue.push(id);
    this.#pump();
  }

  // Full-screen "here's this level's goal" card, shown before each level.
  showLevelIntro(mission, onBegin) {
    this.phase = 'levelintro';
    this.overlay = null;
    this.onIntroBegin = onBegin;
    this.#hideAll();
    const steps = mission.steps
      .map((s, i) => `<div class="ls-step"><span class="ls-n">${i + 1}</span> ${s}</div>`)
      .join('');
    this.innerEl.innerHTML = `
      <div class="ls-tag">${mission.tag}</div>
      <div class="big" style="margin-top:6px">${mission.aim}</div>
      <div class="ls-steps">${steps}</div>
      <div class="menu"><div class="menu-item selected">▶ Start</div></div>
      <div class="foot">E / Space to begin</div>`;
    this.screenEl.classList.remove('hidden');
  }

  startDialogue(speaker, lines, onDone) {
    this.dialogue = { speaker, lines, index: 0, onDone };
    this.overlay = 'dialogue';
    this.#renderDialogue();
  }

  // win: the current level's { title, sub, body, nextLabel, hasNext } metadata.
  // onContinue: called when the player confirms and hasNext is true.
  showWon(items, win, onContinue) {
    this.phase = 'won';
    this.overlay = null;
    this.onWonContinue = win.hasNext ? onContinue : null;
    this.#hideAll();
    const list = items.map((i) => `<li>${i.icon} ${i.name}</li>`).join('');
    const nextCls = win.hasNext ? 'menu-item selected' : 'menu-item selected disabled';
    this.innerEl.innerHTML = `
      <div class="big">${win.title}</div>
      <div class="sub">${win.sub}</div>
      <p class="won-body">${win.body}</p>
      <div class="won-col">
        <div class="won-h">In your backpack:</div>
        <ul>${list}</ul>
      </div>
      <div class="menu"><div class="${nextCls}">${win.nextLabel}</div></div>
      <div class="foot">${win.hasNext ? 'Press <b>E</b> / Space to continue · ' : ''}Press <b>C</b> any time to reread your Codex.</div>`;
    this.screenEl.classList.remove('hidden');
  }

  // ---- Per-frame input handling (only acts while blocking) ----
  update() {
    const confirm = wasPressed('KeyE') || wasPressed('Space') || wasPressed('Enter');
    const up = wasPressed('KeyW') || wasPressed('ArrowUp');
    const down = wasPressed('KeyS') || wasPressed('ArrowDown');
    const codexKey = wasPressed('KeyC');
    const esc = wasPressed('Escape');

    // Codex overlay can be toggled during play, and closed from anywhere it's open.
    if (this.overlay === 'codex') {
      if (codexKey || esc || confirm) this.#closeCodex();
      return;
    }
    if ((this.phase === 'playing' || this.phase === 'won') && this.overlay === null && codexKey && this.codexUnlocked()) {
      this.#openCodex();
      return;
    }

    if (this.overlay === 'factcard') {
      if (confirm) this.#closeCard();
      return;
    }
    if (this.overlay === 'dialogue') {
      if (confirm) this.#advanceDialogue();
      return;
    }

    // Full-screen phases.
    if (this.phase === 'title') this.#updateTitle(up, down, confirm);
    else if (this.phase === 'intro') {
      if (confirm) this.#advanceIntro();
    } else if (this.phase === 'howto') {
      if (confirm) this.#beginPlaying();
    } else if (this.phase === 'credits') {
      if (confirm || esc) this.#renderTitle();
    } else if (this.phase === 'levelintro') {
      if (confirm) {
        const begin = this.onIntroBegin;
        this.onIntroBegin = null;
        this.phase = 'playing';
        this.overlay = null;
        this.screenEl.classList.add('hidden');
        begin?.();
      }
    } else if (this.phase === 'won') {
      if (confirm && this.onWonContinue) {
        const go = this.onWonContinue;
        this.onWonContinue = null;
        this.phase = 'playing';
        this.overlay = null;
        this.screenEl.classList.add('hidden');
        go();
      }
    }
  }

  // ---- Title ----
  #renderTitle() {
    this.phase = 'title';
    this.overlay = null;
    this.#hideAll();
    this.menuIndex = 0;
    this.#drawTitleMenu();
    this.screenEl.classList.remove('hidden');
  }
  #titleItems() {
    return [
      { label: '▶ Start', action: () => this.#beginIntro() },
      { label: 'How to Play', action: () => this.#renderHowto(true) },
      {
        label: this.codexUnlocked() ? 'Codex' : 'Codex (unlocks as you play)',
        disabled: !this.codexUnlocked(),
        action: () => this.#openCodex(),
      },
      { label: 'Credits', action: () => this.#renderCredits() },
    ];
  }
  #drawTitleMenu() {
    const items = this.#titleItems();
    const menu = items
      .map((it, i) => {
        const cls = ['menu-item'];
        if (i === this.menuIndex) cls.push('selected');
        if (it.disabled) cls.push('disabled');
        return `<div class="${cls.join(' ')}">${i === this.menuIndex ? '» ' : ''}${it.label}</div>`;
      })
      .join('');
    this.innerEl.innerHTML = `
      <div class="title-logo">KAFKALAND</div>
      <div class="title-sub">a survival guide to moving to Nuremberg</div>
      <div class="bunny-mark">🐰🧳</div>
      <div class="menu">${menu}</div>
      <div class="foot">↑ ↓ to choose · E / Space to select</div>`;
  }
  #updateTitle(up, down, confirm) {
    const items = this.#titleItems();
    if (up) {
      this.menuIndex = (this.menuIndex - 1 + items.length) % items.length;
      this.#drawTitleMenu();
    } else if (down) {
      this.menuIndex = (this.menuIndex + 1) % items.length;
      this.#drawTitleMenu();
    } else if (confirm) {
      const it = items[this.menuIndex];
      if (!it.disabled) it.action();
    }
  }

  #renderCredits() {
    this.phase = 'credits';
    this.innerEl.innerHTML = `
      <div class="big">Credits</div>
      <p class="won-body">Built from the Kafkaland wiki — a step-by-step guide to relocating to
      Nuremberg. Pixel art from the bundled asset pack (see assets/LICENSE.txt).
      Every Fact Card in this game is a real thing about German bureaucracy. Sorry.</p>
      <div class="foot">Press <b>E</b> to go back</div>`;
  }

  // ---- Intro ----
  #beginIntro() {
    this.phase = 'intro';
    this.introIndex = 0;
    this.#renderIntro();
  }
  #renderIntro() {
    const text = INTRO_PANELS[this.introIndex].replace(/\n/g, '<br>');
    const dots = INTRO_PANELS.map((_, i) => (i === this.introIndex ? '●' : '○')).join(' ');
    this.innerEl.innerHTML = `
      <div class="intro-panel"><div class="intro-text">${text}</div></div>
      <div class="dots">${dots}</div>
      <div class="foot">E / Space to continue</div>`;
  }
  #advanceIntro() {
    this.introIndex++;
    if (this.introIndex >= INTRO_PANELS.length) this.#renderHowto(false);
    else this.#renderIntro();
  }

  // ---- How to Play ----
  #renderHowto(fromTitle) {
    this.phase = 'howto';
    this.fromTitleHowto = fromTitle;
    const controls = HOWTO.controls.map(([k, v]) => `<tr><td class="k">${k}</td><td>${v}</td></tr>`).join('');
    const creatures = HOWTO.creatures.map(([k, v]) => `<div class="row"><b>${k}</b> — ${v}</div>`).join('');
    const systems = HOWTO.systems.map(([k, v]) => `<div class="row"><b>${k}</b> — ${v}</div>`).join('');
    const steps = HOWTO.steps.map(([k, v]) => `<div class="row"><b>${k}</b> — ${v}</div>`).join('');
    this.innerEl.innerHTML = `
      <div class="big">How to Play</div>
      <div class="howto-grid">
        <div class="howto-col">
          <div class="howto-h">Controls</div>
          <table class="controls">${controls}</table>
          <div class="howto-h" style="margin-top:10px">Your goal (in order)</div>
          ${steps}
        </div>
        <div class="howto-col">
          <div class="howto-h">Who you'll meet</div>
          ${creatures}
          <div class="howto-h" style="margin-top:10px">What makes this game <i>this</i> game</div>
          ${systems}
        </div>
      </div>
      <div class="roadmap">${HOWTO.roadmap}</div>
      <div class="menu"><div class="menu-item selected">» Got it →</div></div>
      <div class="foot">E / Space${this.fromTitleHowto ? ' to go back' : ' to begin'}</div>`;
  }
  #beginPlaying() {
    if (this.fromTitleHowto) {
      this.#renderTitle();
      return;
    }
    this.phase = 'playing';
    this.overlay = null;
    this.screenEl.classList.add('hidden');
    this.onStart?.();
  }

  // ---- Dialogue ----
  #renderDialogue() {
    const d = this.dialogue;
    this.dlgEl.querySelector('.dlg-speaker').textContent = d.speaker;
    this.dlgEl.querySelector('.dlg-text').innerHTML = d.lines[d.index];
    this.dlgEl.classList.remove('hidden');
  }
  #advanceDialogue() {
    const d = this.dialogue;
    d.index++;
    if (d.index >= d.lines.length) {
      this.dlgEl.classList.add('hidden');
      this.overlay = null;
      const cb = d.onDone;
      this.dialogue = null;
      cb?.();
      this.#pump();
    } else {
      this.#renderDialogue();
    }
  }

  // ---- Fact cards ----
  #pump() {
    if (this.overlay === null && this.phase === 'playing' && this.factQueue.length) {
      this.#showCard(this.factQueue.shift());
    }
  }
  #showCard(id) {
    const fc = FACT_CARDS[id];
    this.card = id;
    this.overlay = 'factcard';
    if (!this.codexSet.has(id)) {
      this.codexSet.add(id);
      this.codexSeen.push(id);
    }
    this.cardEl.querySelector('.fc-title').textContent = fc.title;
    this.cardEl.querySelector('.fc-body').textContent = fc.body;
    this.cardEl.classList.remove('hidden');
  }
  #closeCard() {
    this.cardEl.classList.add('hidden');
    this.overlay = null;
    this.card = null;
    this.#pump();
  }

  // ---- Codex ----
  #openCodex() {
    this.overlay = 'codex';
    const list = this.codexSeen
      .map((id) => `<div class="cx-entry"><div class="cx-t">${FACT_CARDS[id].title}</div><div class="cx-b">${FACT_CARDS[id].body}</div></div>`)
      .join('') || '<div class="cx-empty">Nothing yet. Go collect some documents.</div>';
    document.getElementById('codex-list').innerHTML = list;
    this.codexEl.classList.remove('hidden');
    // If opened from the title screen, hide the menu behind it.
    if (this.phase === 'title') this.screenEl.classList.add('hidden');
  }
  #closeCodex() {
    this.codexEl.classList.add('hidden');
    this.overlay = null;
    if (this.phase === 'title') this.#renderTitle();
  }

  #hideAll() {
    this.dlgEl.classList.add('hidden');
    this.cardEl.classList.add('hidden');
    this.codexEl.classList.add('hidden');
  }
}
