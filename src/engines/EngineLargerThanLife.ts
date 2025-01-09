/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineLargerThanLife.js - Larger than Life CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { Constants } from '../utils/Constants.js';

export class EngineLargerThanLife extends BaseEngine implements ICaEngine {
  static MAX_RANGE = 10;

  // Larger than Life specific parameters
  range: number = 5;
  isMoore: boolean = true; // Moore neighborhood (true) or von Neumann (false)
  isHistory: boolean = false; // with history?
  useCenter: boolean = true; // use the center (middle) cell?
  sMin: number = 34; // surviving rules min
  sMax: number = 58; // surviving rules max
  bMin: number = 34; // birth rules min
  bMax: number = 45; // birth rules max

  constructor() {
    super();

    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 2;
    this.range = 5;
    this.isMoore = true;
    this.isHistory = false;
    this.useCenter = true;
    this.sMin = 34;
    this.sMax = 58;
    this.bMin = 34;
    this.bMax = 45;
  }

  // Parse rule string like "R5,C0,M1,S34..58,B34..45,NM"
  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (!ruleDefinition) return;

    const tokens = ruleDefinition.split(',');
    for (const token of tokens) {
      const upperToken = token.trim().toUpperCase();

      if (upperToken.startsWith('R')) this.range = parseInt(upperToken.substring(1));
      else if (upperToken.startsWith('C')) {
        const states = parseInt(upperToken.substring(1));
        if (states >= 3) {
          this.isHistory = true;
          this.numStates = states;
        } else {
          this.isHistory = false;
        }
      } else if (upperToken.startsWith('M')) this.useCenter = parseInt(upperToken.substring(1)) > 0;
      else if (upperToken === 'NM') this.isMoore = true;
      else if (upperToken === 'NN') this.isMoore = false;
      else if (upperToken.startsWith('S')) {
        const parts = upperToken.substring(1).split('..');
        if (parts.length === 2) {
          this.sMin = parseInt(parts[0]);
          this.sMax = parseInt(parts[1]);
        }
      } else if (upperToken.startsWith('B')) {
        const parts = upperToken.substring(1).split('..');
        if (parts.length === 2) {
          this.bMin = parseInt(parts[0]);
          this.bMax = parseInt(parts[1]);
        }
      }
    }

    this.validate();
  }

  // Create rule string like "R5,C0,M1,S34..58,B34..45,NM"
  getAsString() {
    this.validate();

    let parts = [];
    parts.push(`R${this.range}`);
    parts.push(`C${this.isHistory ? this.numStates : 0}`);
    parts.push(`M${this.useCenter ? 1 : 0}`);
    parts.push(`S${this.sMin}..${this.sMax}`);
    parts.push(`B${this.bMin}..${this.bMax}`);
    parts.push(this.isMoore ? 'NM' : 'NN');

    return parts.join(',');
  }

  validate() {
    // Validate and correct parameters if necessary
    if (this.numStates < 2) this.numStates = 2;
    else if (this.numStates > Constants.MAX_STATES) this.numStates = Constants.MAX_STATES;

    if (this.range < 1) this.range = 1;
    else if (this.range > EngineLargerThanLife.MAX_RANGE)
      this.range = EngineLargerThanLife.MAX_RANGE;

    // Calculate max threshold based on neighborhood size
    let maxThreshold = this.useCenter ? 1 : 0;
    for (let i = 1; i <= this.range; i++) {
      maxThreshold += i * 8;
    }

    // Bound the thresholds
    this.sMin = this.boundInt(1, this.sMin, maxThreshold);
    this.sMax = this.boundInt(1, this.sMax, maxThreshold);
    this.bMin = this.boundInt(1, this.bMin, maxThreshold);
    this.bMax = this.boundInt(1, this.bMax, maxThreshold);
  }

  boundInt(min: number, val: number, max: number): number {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  }

  // Perform one pass of the rule
  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modCount = 0;

    for (let y = 0; y < sizY; y++) {
      for (let x = 0; x < sizX; x++) {
        const oldVal = currentState.cells[x][y];
        let newVal = oldVal; // Default - no change

        if (newVal >= this.numStates) newVal = this.numStates - 1;

        let count = 0; // Count of firing neighbors

        // Count neighbors in range
        for (let dx = -this.range; dx <= this.range; dx++) {
          for (let dy = -this.range; dy <= this.range; dy++) {
            // Skip center cell if not using it
            if (!this.useCenter && dx === 0 && dy === 0) continue;

            // Skip cells outside Moore/von Neumann neighborhood
            if (!this.isMoore && Math.abs(dx) + Math.abs(dy) > this.range) continue;

            // Calculate neighbor coordinates
            let nx = x + dx;
            let ny = y + dy;

            // Handle wrapping or bounds checking
            if (engineState.isWrap) {
              nx = (nx + sizX) % sizX;
              ny = (ny + sizY) % sizY;
            } else {
              // Skip if outside bounds for non-wrapping board
              if (nx < 0 || nx >= sizX || ny < 0 || ny >= sizY) continue;
            }

            // Count live neighbors
            if (currentState.cells[nx][ny] === 1) count++;
          }
        }

        // Determine new state
        if (this.isHistory) {
          if (oldVal <= 1) {
            // Can survive or be born
            if (oldVal === 0) {
              // Dead cell
              if (count >= this.bMin && count <= this.bMax) newVal = 1; // Birth
            } else {
              // Live cell
              if (count >= this.sMin && count <= this.sMax)
                newVal = 1; // Survival
              else if (oldVal < this.numStates - 1)
                newVal = oldVal + 1; // Getting older
              else newVal = 0; // Death
            }
          } else {
            // Older than 1
            if (oldVal < this.numStates - 1)
              newVal = oldVal + 1; // Getting older
            else newVal = 0; // Death
          }
        } else {
          // No history
          if (oldVal === 0) {
            // Dead cell
            if (count >= this.bMin && count <= this.bMax) newVal = 1; // Birth
          } else {
            // Live cell
            if (!(count >= this.sMin && count <= this.sMax)) newVal = 0; // Death by isolation or overcrowding
          }
        }

        newState.cells[x][y] = newVal;
        if (newVal !== oldVal) modCount++;
      }
    }

    return modCount;
  }

  // Examples: "R5,C0,M1,S34..58,B34..45,NM", "R4,C0,M1,S41..81,B41..81,NM"
  randomRule(): string {
    const range = Math.floor(Math.random() * EngineLargerThanLife.MAX_RANGE) + 1;
    const numStates = Math.floor(Math.random() * 8) + 2;
    const isMoore = Math.random() < 0.5;
    const isHistory = Math.random() < 0.5;
    const useCenter = Math.random() < 0.5;
    let sMin = Math.floor(Math.random() * (range * 8)) + 1;
    let sMax = Math.floor(Math.random() * (range * 8)) + 1;
    if (sMin > sMax) {
      const temp = sMin;
      sMin = sMax;
      sMax = temp;
    }
    let bMin = Math.floor(Math.random() * (range * 8)) + 1;
    let bMax = Math.floor(Math.random() * (range * 8)) + 1;
    if (bMin > bMax) {
      const temp = bMin;
      bMin = bMax;
      bMax = temp;
    }

    return `R${range}/C${isHistory ? numStates : 0}/M${useCenter ? 1 : 0}/S${sMin}..${sMax}/B${bMin}..${bMax}/${isMoore ? 'NM' : 'NN'}`;
  }
}
