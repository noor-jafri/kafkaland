import { Game } from "./engine/Game.js";

const canvas = document.getElementById("scene");
const game = new Game(canvas);
game.start();

// Dev-console access (e.g. window.game.player.x) — harmless in production.
window.game = game;
