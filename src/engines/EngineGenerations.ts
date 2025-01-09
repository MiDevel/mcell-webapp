/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineGenerations.js - Generations CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';

export class EngineGenerations extends BaseEngine implements ICaEngine {
  rulesS = new Array(9).fill(0);
  rulesB = new Array(9).fill(0);

  constructor() {
    super();

    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 2;
    this.rulesS = new Array(9).fill(0);
    this.rulesB = new Array(9).fill(0);
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();
    if (!ruleDefinition) return;

    const tokens = ruleDefinition.split('/');
    if (tokens.length !== 3) {
      console.log(`Invalid Generations rule format. s/b/c expected, got ${ruleDefinition}`);
      return;
    }

    // tokens[0] is survive
    tokens[0].split('').forEach((ch) => {
      const index = parseInt(ch, 10);
      if (index >= 0 && index <= 8) {
        this.rulesS[index] = 1;
      }
    });

    // tokens[1] is birth
    tokens[1].split('').forEach((ch) => {
      const index = parseInt(ch, 10);
      if (index >= 0 && index <= 8) {
        this.rulesB[index] = 1;
      }
    });

    // tokens[2] is number of states
    this.numStates = parseInt(tokens[2], 10);
    if (isNaN(this.numStates) || this.numStates < 2) {
      console.log(`Invalid number of states: ${this.numStates}`);
      this.numStates = 2;
    }
  }

  getAsString() {
    let s = this.rulesS.map((v, i) => (v ? i : '')).join('');
    let b = this.rulesB.map((v, i) => (v ? i : '')).join('');
    return `${s}/${b}/${this.numStates}`;
  }

  updateCell(currentState: number, neighbors: number): number {
    if (currentState === 0) {
      return this.rulesB[neighbors] ? 1 : 0;
    } else if (currentState === 1) {
      return this.rulesS[neighbors] ? 1 : 2;
    } else {
      return (currentState + 1) % this.numStates;
    }
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modifiedCells = 0;
    for (let y = 0; y < sizY; y++) {
      for (let x = 0; x < sizX; x++) {
        let neighbors = 0;

        // Count neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            let nx = x + dx;
            let ny = y + dy;

            if (engineState.isWrap) {
              nx = (nx + sizX) % sizX;
              ny = (ny + sizY) % sizY;
            } else if (nx < 0 || nx >= sizX || ny < 0 || ny >= sizY) {
              continue;
            }

            if (currentState.cells[nx][ny] === 1) {
              neighbors++;
            }
          }
        }

        const newValue = this.updateCell(currentState.cells[x][y], neighbors);
        if (newValue !== currentState.cells[x][y]) {
          modifiedCells++;
        }
        newState.cells[x][y] = newValue;
      }
    }
    return modifiedCells;
  }

  // Syntax: "s/b/n", for example "24/357/4" or "02/128/7"
  randomRule(): string {
    let ret: string = '';
    ret += Math.random() < 0.1 ? '0' : '';
    ret += Math.random() < 0.3 ? '1' : '';
    ret += Math.random() < 0.3 ? '2' : '';
    ret += Math.random() < 0.3 ? '3' : '';
    ret += Math.random() < 0.3 ? '4' : '';
    ret += Math.random() < 0.3 ? '5' : '';
    ret += Math.random() < 0.3 ? '6' : '';
    ret += Math.random() < 0.3 ? '7' : '';
    ret += Math.random() < 0.3 ? '8' : '';

    ret += '/';
    ret += Math.random() < 0.01 ? '0' : '';
    ret += Math.random() < 0.2 ? '1' : '';
    ret += Math.random() < 0.3 ? '2' : '';
    ret += Math.random() < 0.3 ? '3' : '';
    ret += Math.random() < 0.3 ? '4' : '';
    ret += Math.random() < 0.3 ? '5' : '';
    ret += Math.random() < 0.3 ? '6' : '';
    ret += Math.random() < 0.3 ? '7' : '';
    ret += Math.random() < 0.3 ? '8' : '';

    ret += '/';
    ret += Math.floor(Math.random() * 8 + 2);

    return ret;
  }
}
