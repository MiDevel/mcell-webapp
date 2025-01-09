/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// index.js
import { settings } from './core/Settings.js';
import { boardState } from './core/BoardState.js';
import { gameState } from './core/GameState.js';
import { board } from './ui/Board.js';
import { controls } from './ui/Controls.js';
import { undoSystem } from './core/UndoSystem.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize settings
  settings.getAllSettings();
  // console.log('Settings initialized:', settings.getAllSettings());

  // Wait for controls to initialize (which includes waiting for game state)
  await controls.initialize();

  // Randomize initial board
  boardState.randomize();
  undoSystem.clearAll();

  // Set up game loop
  let lastTime: number = 0;
  const gameLoop = (timestamp: number) => {
    if (gameState.isRunning) {
      const deltaTime = timestamp - lastTime;
      // If speed is 0, run as fast as possible
      // Otherwise, use the speed value as milliseconds delay
      if (gameState.speed === 0 || deltaTime >= gameState.speed) {
        controls.runOneCycle();
        lastTime = timestamp;
      }
    } else {
      lastTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
  };

  // Start game loop
  requestAnimationFrame(gameLoop);

  // Set initial speed in dropdown
  const speedSelect: HTMLSelectElement = document.getElementById('speed') as HTMLSelectElement;
  if (speedSelect) {
    speedSelect.value = gameState.speed.toString();
  }

  // Draw initial board
  board.drawBoard();
});
