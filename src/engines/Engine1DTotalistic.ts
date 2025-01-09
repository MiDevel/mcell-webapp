/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Engine1DTotalistic.js - 1-D Totalistic CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { CaEngines } from '../core/CaEngines.js';

export class Engine1DTotalistic extends BaseEngine implements ICaEngine {
  static MAX_RANGE = 10;

  isHistory = false; // with history?
  isCenter = true; // use the center (middle) cell?
  range = 2; // range, 1..10
  rulesS = new Array(Engine1DTotalistic.MAX_RANGE * 2 + 2).fill(false); // rules for surviving
  rulesB = new Array(Engine1DTotalistic.MAX_RANGE * 2 + 2).fill(false); // rules for birth

  constructor() {
    super();
    this.universeType = CaEngines.UNIV_TYPE_1D;
    this.setDefaults();
  }

  setDefaults() {
    this.isHistory = false;
    this.numStates = 2;
    this.isCenter = true;
    this.range = 2;
    this.rulesS = new Array(Engine1DTotalistic.MAX_RANGE * 2 + 2).fill(false);
    this.rulesB = new Array(Engine1DTotalistic.MAX_RANGE * 2 + 2).fill(false);
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;
    if (this.range < 1) this.range = 1;
    else if (this.range > Engine1DTotalistic.MAX_RANGE) this.range = Engine1DTotalistic.MAX_RANGE;
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();
    if (!ruleDefinition) return;

    const tokens = ruleDefinition.split(',');
    tokens.forEach((token) => {
      const upperToken = token.toUpperCase();
      if (upperToken.startsWith('R')) {
        this.range = parseInt(upperToken.substring(1), 10);
      } else if (upperToken.startsWith('C')) {
        const states = parseInt(upperToken.substring(1), 10);
        if (states >= 3) {
          this.isHistory = true;
          this.numStates = states;
        } else {
          this.isHistory = false;
        }
      } else if (upperToken.startsWith('M')) {
        this.isCenter = parseInt(upperToken.substring(1), 10) > 0;
      } else if (upperToken.startsWith('S')) {
        const index = parseInt(upperToken.substring(1), 10);
        if (index >= 0 && index <= Engine1DTotalistic.MAX_RANGE * 2 + 1) {
          this.rulesS[index] = true;
        }
      } else if (upperToken.startsWith('B')) {
        const index = parseInt(upperToken.substring(1), 10);
        if (index >= 0 && index <= Engine1DTotalistic.MAX_RANGE * 2 + 1) {
          this.rulesB[index] = true;
        }
      }
    });

    if (!this.isHistory) {
      this.numStates = 8;
    }
    this.validate();
  }

  getAsString() {
    this.validate();
    let result = `R${this.range}`;
    result += `,C${this.isHistory ? this.numStates : 0}`;
    result += `,M${this.isCenter ? '1' : '0'}`;

    // S rules
    for (let i = 0; i <= Engine1DTotalistic.MAX_RANGE * 2 + 1; i++) {
      if (this.rulesS[i]) result += `,S${i}`;
    }

    // B rules
    for (let i = 0; i <= Engine1DTotalistic.MAX_RANGE * 2 + 1; i++) {
      if (this.rulesB[i]) result += `,B${i}`;
    }

    return result;
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    // Copy entire currentState to newState first
    for (let y = 0; y < sizY; y++) {
      for (let x = 0; x < sizX; x++) {
        newState.cells[x][y] = currentState.cells[x][y];
      }
    }

    const nextRow = (engineState.last1DRow + 1) % sizY;
    const margin = this.range;
    const row = new Array(sizX + 2 * margin).fill(0);

    // Copy current row with margins
    for (let x = 0; x < sizX; x++) {
      row[x + margin] = currentState.cells[x][engineState.last1DRow];
    }

    // Handle wrapping for margins
    if (engineState.isWrap) {
      for (let i = 1; i <= margin; i++) {
        row[margin - i] = row[sizX - i + margin];
        row[sizX - 1 + i + margin] = row[margin + i - 1];
      }
    }

    // Process each cell in the next row
    for (let x = 0; x < sizX; x++) {
      const oldValue = row[x + margin];
      let neighborSum = 0;

      if (this.isHistory) {
        if (oldValue <= 1) {
          // can survive or be born
          if (this.isCenter && row[x + margin] === 1) neighborSum++;
          for (let i = 1; i <= this.range; i++) {
            if (row[x - i + margin] === 1) neighborSum++;
            if (row[x + i + margin] === 1) neighborSum++;
          }

          let newValue = oldValue;
          if (oldValue === 0) {
            // dead cell
            if (this.rulesB[neighborSum]) newValue = 1;
          } else {
            // live cell
            if (this.rulesS[neighborSum]) {
              newValue = 1;
            } else {
              newValue = oldValue < this.numStates - 1 ? oldValue + 1 : 0;
            }
          }
          newState.cells[x][nextRow] = newValue;
        } else {
          // aging
          newState.cells[x][nextRow] = oldValue < this.numStates - 1 ? oldValue + 1 : 0;
        }
      } else {
        // no history
        if (this.isCenter && row[x + margin] > 0) neighborSum++;
        for (let i = 1; i <= this.range; i++) {
          if (row[x - i + margin] > 0) neighborSum++;
          if (row[x + i + margin] > 0) neighborSum++;
        }

        let newValue = oldValue;
        if (oldValue === 0) {
          // dead cell
          if (this.rulesB[neighborSum]) newValue = 1;
        } else {
          // live cell
          if (this.rulesS[neighborSum]) {
            newValue = oldValue < this.numStates - 1 ? oldValue + 1 : this.numStates - 1;
          } else {
            newValue = 0;
          }
        }
        newState.cells[x][nextRow] = newValue;
      }
    }

    engineState.last1DRow = nextRow;
    return 1; // Always return 1 to continue running
  }

  // Examples: "R2,C10,M1,S0,S1,B0,B3", "R4,C0,M1,S1,S2,S5,S6,S9,B3,B4,B6"
  randomRule(): string {
    const range = Math.floor(Math.random() * Engine1DTotalistic.MAX_RANGE) + 1;
    const numStates = Math.floor(Math.random() * 8) + 2;
    const isCenter = Math.random() >= 0.3;
    const isHistory = Math.random() >= 0.3;
    const sTotals = [];
    const bTotals = [];
    for (let i = 0; i < range * 2 + 2; i++) {
      if (Math.random() >= 0.65) sTotals.push('S' + i.toString());
      if (Math.random() >= 0.65) bTotals.push('B' + i.toString());
    }
    return `R${range},C${isHistory ? numStates : 0},M${isCenter ? '1' : '0'},${sTotals.join(',')},${bTotals.join(',')}`;
  }
}
