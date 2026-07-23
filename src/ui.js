import { BACKPACK_SLOTS } from './map.js';

// DOM-based HUD: backpack slots, pickup hint, toast messages.
export class HUD {
  constructor() {
    this.backpackEl = document.getElementById('backpack');
    this.hintEl = document.getElementById('hint');
    this.toastEl = document.getElementById('toast');
    this.questEl = document.getElementById('quest');
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

  showHint(show) {
    this.hintEl.style.display = show ? 'block' : 'none';
  }

  toast(msg, ms = 2200) {
    this.toastEl.textContent = msg;
    this.toastEl.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => (this.toastEl.style.opacity = '0'), ms);
  }

  setQuest(text) {
    this.questEl.textContent = text;
  }
}
