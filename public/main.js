// main.js
import { GameManager } from './GameManager.js';

// Initialize the game manager
window.gameManager = new GameManager();

// Handle window resize
window.addEventListener('resize', () => {
    window.gameManager.onWindowResize();
});
