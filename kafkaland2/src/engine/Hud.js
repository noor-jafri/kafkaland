export class Hud {
  constructor() {
    this.docCountEl = document.getElementById("doc-count");
    this.docTotalEl = document.getElementById("doc-total");
    this.bannerEl = document.getElementById("banner");
    this.hintEl = document.getElementById("hint");
    this.introEl = document.getElementById("intro-overlay");
    this.startBtn = document.getElementById("start-btn");
    this._bannerTimeout = null;
  }

  setDocTotal(total) {
    this.docTotalEl.textContent = String(total);
  }

  setDocCount(count) {
    this.docCountEl.textContent = String(count);
  }

  showBanner(text, duration = 2200) {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove("hidden");
    clearTimeout(this._bannerTimeout);
    this._bannerTimeout = setTimeout(() => {
      this.bannerEl.classList.add("hidden");
    }, duration);
  }

  hideHint() {
    this.hintEl.classList.add("hidden");
  }

  onStart(callback) {
    this.startBtn.addEventListener("click", () => {
      this.introEl.classList.add("hidden");
      callback();
    });
  }
}
