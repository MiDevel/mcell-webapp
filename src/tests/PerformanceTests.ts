/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// PerformanceTests.js
import { gameState } from '../core/GameState.js';
import { boardState } from '../core/BoardState.js';
import { controls } from '../ui/Controls.js';
import { board } from '../ui/Board.js';
import { settings } from '../core/Settings.js';
import { CaEngines } from '../core/CaEngines.js';

// Utility function to set up standard test configuration
function setTestConfiguration() {
  controls.setBoardSize(300, 200);
  controls.setCellSize(6);
  controls.setSpeed(0);
  gameState.setState({ showGrid: true });
  controls.clear();

  // Set two cells in the center
  const centerX = Math.floor(300 / 2);
  const centerY = Math.floor(200 / 2);
  boardState.lattice.setCell(centerX, centerY, 1);
  boardState.lattice.setCell(centerX + 1, centerY, 1);
  controls.centerPattern();

  // Set the rule
  gameState.activateRule(CaEngines.FAMILY_GENERATIONS, '345/2/4');

  // Update the palettes based on the number of states
  settings.setPaletteName('MCell');
}

export function runSpeedTest() {
  // Stop simulation if running
  if (gameState.isRunning) {
    gameState.setState({ isRunning: false });
  }

  // Set up test configuration
  setTestConfiguration();

  // Start timing
  const startTime = performance.now();

  // Run simulation
  let cyclesCompleted = 0;
  const targetCycles = 1000;

  function runCycles() {
    if (cyclesCompleted < targetCycles) {
      controls.runOneCycle();
      cyclesCompleted++;
      requestAnimationFrame(runCycles);
    } else {
      const endTime = performance.now();
      const elapsedTime = endTime - startTime;
      const formattedTime = (elapsedTime / 1000).toFixed(3);

      console.log(`Speed test completed: ${formattedTime}s for ${targetCycles} cycles`);
      console.log(`Number of draws: ${board.numBoardDraws}`);
      alert(
        `Speed test completed\n${formattedTime}s for ${targetCycles} cycles\nNumber of draws: ${board.numBoardDraws}`
      );
    }
  }

  board.numBoardDraws = 0;
  runCycles();
}
