/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineCyclicCA.js - Cyclic CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { Constants } from '../utils/Constants.js';

export class EngineCyclicCA extends BaseEngine implements ICaEngine {
  static MAX_RANGE = 10;

  range: number;
  threshold: number;
  isMoore: boolean;
  isGH: boolean;

  constructor() {
    super();

    // Cyclic CA specific parameters
    this.range = 1; // neighborhood range
    this.threshold = 3; // threshold for state change
    this.isMoore = true; // Moore neighborhood (true) or von Neumann (false)
    this.isGH = false; // Greenberg-Hastings Model

    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 3; // count of states (previously iClo)
    this.range = 1; // range
    this.threshold = 3; // threshold
    this.isMoore = true; // neighborhood type (Moore)
    this.isGH = false; // Greenberg-Hastings Model
  }

  // Parse rule string like "R1/T3/C5/NM" or "R2/T5/C7/NN/GH"
  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (!ruleDefinition) return;

    const tokens = ruleDefinition.split('/');
    for (const token of tokens) {
      const upperToken = token.trim().toUpperCase();

      if (upperToken.startsWith('R')) this.range = parseInt(upperToken.substring(1));
      else if (upperToken.startsWith('T')) this.threshold = parseInt(upperToken.substring(1));
      else if (upperToken.startsWith('C')) this.numStates = parseInt(upperToken.substring(1));
      else if (upperToken === 'NM') this.isMoore = true;
      else if (upperToken === 'NN') this.isMoore = false;
      else if (upperToken === 'GH') this.isGH = true;
    }

    this.validate();
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;
    else if (this.numStates > Constants.MAX_STATES) this.numStates = Constants.MAX_STATES;

    if (this.range < 1) this.range = 1;
    else if (this.range > EngineCyclicCA.MAX_RANGE) this.range = EngineCyclicCA.MAX_RANGE;

    // Calculate max threshold based on range
    let maxThreshold = 0;
    for (let i = 1; i <= this.range; i++) {
      maxThreshold += i * 8;
    }

    if (this.threshold < 1) this.threshold = 1;
    else if (this.threshold > maxThreshold) this.threshold = maxThreshold;
  }

  getAsString(): string {
    this.validate();

    let result = `R${this.range}/T${this.threshold}/C${this.numStates}`;
    result += this.isMoore ? '/NM' : '/NN';
    if (this.isGH) result += '/GH';

    return result;
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modifiedCells = 0;

    for (let y = 0; y < sizY; y++) {
      for (let x = 0; x < sizX; x++) {
        const oldVal = currentState.cells[x][y];
        const nextState = oldVal >= this.numStates - 1 ? 0 : oldVal + 1;
        let newVal = oldVal; // default - no change

        if (!this.isGH || oldVal === 0) {
          let count = 0; // count of neighbors with the next state

          // Check all cells within range
          for (let dx = -this.range; dx <= this.range; dx++) {
            for (let dy = -this.range; dy <= this.range; dy++) {
              if (dx === 0 && dy === 0) continue; // Skip center cell

              // For von Neumann neighborhood, skip cells outside Manhattan distance
              if (!this.isMoore && Math.abs(dx) + Math.abs(dy) > this.range) continue;

              let nx = x + dx;
              let ny = y + dy;

              if (engineState.isWrap) {
                nx = (nx + sizX) % sizX;
                ny = (ny + sizY) % sizY;
              } else if (nx < 0 || nx >= sizX || ny < 0 || ny >= sizY) {
                continue;
              }

              if (currentState.cells[nx][ny] === nextState) {
                count++;
              }
            }
          }

          if (count >= this.threshold) {
            newVal = nextState;
          }
        } else {
          newVal = nextState; // in GH model, all states > 0 automatically advance
        }

        newState.cells[x][y] = newVal;
        if (newVal !== oldVal) {
          modifiedCells++;
        }
      }
    }

    return modifiedCells;
  }

  // Examples: "R1/T3/C5/NM/GH", "R2/T5/C7/NN/GH"
  randomRule(): string {
    const range = Math.floor(Math.random() * EngineCyclicCA.MAX_RANGE) + 1;
    const threshold = Math.floor(Math.random() * (range * 8)) + 1;
    const numStates = Math.floor(Math.random() * 16) + 2;
    const isMoore = Math.random() < 0.5;
    const isGH = Math.random() < 0.5;

    return `R${range}/T${threshold}/C${numStates}/${isMoore ? 'NM' : 'NN'}${isGH ? '/GH' : ''}`;
  }
}
