import { BACKPACK_SLOTS } from './config.js';

// DOM-based HUD: objective, backpack, contextual prompt, frustration meter,
// day counter, and toast messages.
export class HUD {
  constructor() {
    this.backpackEl = document.getElementById('backpack');
    this.hintEl = document.getElementById('hint');
    this.toastEl = document.getElementById('toast');
    this.questEl = document.getElementById('quest');
    this.dayEl = document.getElementById('day');
    this.frustFillEl = document.getElementById('frust-fill');
    this.frustWrapEl = document.getElementById('frust');
    this.items = [];
    this.#renderSlots();
  }

  #renderSlots() {
    this.backpackEl.innerHTML = '';
    for (let i = 0; i < BACKPACK_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const item = this.items[i];
      if (item) {
        slot.classList.add('filled');
        slot.textContent = item.icon;
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = item.name;
        slot.appendChild(label);
      }
      this.backpackEl.appendChild(slot);
    }
  }

  addItem(item) {
    this.items.push(item);
    this.#renderSlots();
    this.toast(`${item.icon} ${item.name} added to backpack!`);
  }

  hasItem(id) {
    return this.items.some((i) => i.id === id);
  }

  // Drop everything except the listed item ids (carry-over between levels).
  keepItems(ids) {
    this.items = this.items.filter((i) => ids.includes(i.id));
    this.#renderSlots();
  }

  // Contextual interact prompt, e.g. "E — Enter the Bürgeramt". Pass null to hide.
  showPrompt(text) {
    if (!text) {
      this.hintEl.style.display = 'none';
      return;
    }
    this.hintEl.innerHTML = text;
    this.hintEl.style.display = 'block';
  }

  setObjective(text) {
    this.questEl.textContent = text;
  }

  setDay(day, deadline) {
    const late = day > deadline;
    this.dayEl.innerHTML = late
      ? `📅 Tag ${day} <span class="late">(past the ${deadline}-day deadline!)</span>`
      : `📅 Tag ${day} / ${deadline}`;
  }

  setFrustration(value, max) {
    const pct = Math.max(0, Math.min(1, value / max));
    this.frustFillEl.style.width = `${pct * 100}%`;
    this.frustWrapEl.classList.toggle('high', pct >= 0.6 && pct < 1);
    this.frustWrapEl.classList.toggle('maxed', pct >= 1);
  }

  toast(msg, ms = 2400) {
    this.toastEl.textContent = msg;
    this.toastEl.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => (this.toastEl.style.opacity = '0'), ms);
  }
}
