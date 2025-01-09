/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineVoteForLife.js - Vote for Life CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';

export class EngineVoteForLife extends BaseEngine implements ICaEngine {
  rulesSB = new Array(10).fill(false); // rules for birth/surviving

  constructor() {
    super();
    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 2;
    this.rulesSB = new Array(10).fill(false);
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (ruleDefinition === undefined || ruleDefinition === '') {
      return;
    }

    // Parse numbers from the string and set corresponding rules
    ruleDefinition.split(/[,/]/).forEach((part) => {
      part.split('').forEach((ch) => {
        const index = parseInt(ch, 10);
        if (index >= 0 && index <= 9) {
          this.rulesSB[index] = true;
        }
      });
    });
  }

  getAsString() {
    // Create string like '46789'
    return this.rulesSB.map((v, i) => (v ? i : '')).join('');
  }

  updateCell(currentState: number, neighbors: number): number {
    if (currentState === 0) {
      // was dead
      return this.rulesSB[neighbors] ? 1 : 0; // birth
    } else {
      // was alive
      if (this.rulesSB[neighbors]) {
        // rules for surviving
        return currentState < this.numStates - 1 ? currentState + 1 : this.numStates - 1;
      }
      return 0; // isolation or overpopulation
    }
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modifiedCells = 0;

    for (let y = 0; y < sizY; y++) {
      for (let x = 0; x < sizX; x++) {
        let neighbors = 0;
        let oldVal = currentState.cells[x][y];

        // Count neighbors including the cell itself
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            let nx = x + dx;
            let ny = y + dy;

            // Handle wrapping
            if (engineState.isWrap) {
              nx = (nx + sizX) % sizX;
              ny = (ny + sizY) % sizY;
            } else if (nx < 0 || nx >= sizX || ny < 0 || ny >= sizY) {
              continue;
            }

            if (currentState.cells[nx][ny] !== 0) {
              neighbors++;
            }
          }
        }

        let newVal = this.updateCell(oldVal, neighbors);
        newState.cells[x][y] = newVal;

        if (newVal !== oldVal) {
          modifiedCells++;
        }
      }
    }

    return modifiedCells;
  }

  // Examples: "1358", "46789"
  randomRule(): string {
    let ret: string = '';

    while (ret.length == 0) {
      ret += Math.random() < 0.1 ? '0' : '';
      ret += Math.random() < 0.3 ? '1' : '';
      ret += Math.random() < 0.3 ? '2' : '';
      ret += Math.random() < 0.3 ? '3' : '';
      ret += Math.random() < 0.3 ? '4' : '';
      ret += Math.random() < 0.3 ? '5' : '';
      ret += Math.random() < 0.3 ? '6' : '';
      ret += Math.random() < 0.3 ? '7' : '';
      ret += Math.random() < 0.3 ? '8' : '';
      ret += Math.random() < 0.3 ? '9' : '';
    }

    return ret;
  }
}
