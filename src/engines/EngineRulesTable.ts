/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineRulesTable.js - Rules Table CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { Constants } from '../utils/Constants.js';

export class EngineRulesTable extends BaseEngine implements ICaEngine {
  nghTyp = 1; // neighbourhood type, 1=Moore or 2=von Neumann
  ctrCell = true; // use the center cell?
  all1Fire = false; // all from state 1 can fire
  table = Array(Constants.MAX_STATES + 1)
    .fill(0)
    .map(() => Array(10).fill(0)); // rules table

  constructor() {
    super();
    this.setDefaults();
  }

  setDefaults() {
    this.nghTyp = 1; // Moore neighbourhood
    this.ctrCell = true; // use the center cell
    this.all1Fire = false; // all from state 1 cannot fire
    this.numStates = 2;

    // Initialize table with zeros
    for (let s = 0; s <= Constants.MAX_STATES; s++) {
      for (let n = 0; n <= 9; n++) {
        this.table[s][n] = 0;
      }
    }
  }

  // Parse the rule string.
  // Example: "1,0,0,0,0,1,2,0,2,2,2,2,0,2,2,2,1,0,2,2,2,2,0,0,0,0,0,1,2,2,1,2"
  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (!ruleDefinition || ruleDefinition.length <= 6) return;

    const tokens = ruleDefinition.split(',').map((t) => parseInt(t.trim()));
    if (tokens.length < 4) return;

    // Parse header parameters
    this.nghTyp = tokens[0] === 2 ? 2 : 1;
    this.ctrCell = tokens[1] === 1;
    this.all1Fire = tokens[2] === 1;

    // Parse rules table
    let maxState = 0;
    for (let i = 3; i < tokens.length; i++) {
      const stateIdx = Math.floor((i - 3) / 10);
      const nghIdx = (i - 3) % 10;
      const val = Math.max(0, Math.min(tokens[i], Constants.MAX_STATES));
      this.table[stateIdx][nghIdx] = val;
      maxState = Math.max(maxState, stateIdx);
    }

    this.numStates = maxState + 2;
    this.validate();
  }

  getAsString() {
    this.validate();

    let parts = [
      this.nghTyp === 2 ? '2' : '1',
      this.ctrCell ? '1' : '0',
      this.all1Fire ? '1' : '0',
    ];

    // Add table values
    for (let s = 0; s <= Constants.MAX_STATES; s++) {
      for (let n = 0; n <= 9; n++) {
        parts.push(this.table[s][n].toString());
      }
    }

    // Remove trailing zeros
    while (parts.length > 3 && parts[parts.length - 1] === '0') {
      parts.pop();
    }

    return parts.join(',');
  }

  validate() {
    this.table[0][0] = 0; // safety-valve

    if (this.numStates < 2) this.numStates = 2;
    else if (this.numStates > Constants.MAX_STATES) this.numStates = Constants.MAX_STATES;
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modCount = 0;
    const isMoore = this.nghTyp === 1;
    const rtMask = this.all1Fire ? 1 : 0xff;

    // Ensure we're using the correct dimensions
    // const width = currentState[0].length;  // numCols
    // const height = currentState.length;    // numRows
    const width = sizX;
    const height = sizY;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const oldVal = Math.min(currentState.cells[x][y], Constants.MAX_STATES);
        let count = 0;

        // Calculate neighbor coordinates with wrapping
        const left = x > 0 ? x - 1 : engineState.isWrap ? width - 1 : -1;
        const right = x < width - 1 ? x + 1 : engineState.isWrap ? 0 : -1;
        const up = y > 0 ? y - 1 : engineState.isWrap ? height - 1 : -1;
        const down = y < height - 1 ? y + 1 : engineState.isWrap ? 0 : -1;

        // Count neighbors
        if (isMoore && left >= 0 && up >= 0 && (currentState.cells[left][up] & rtMask) === 1)
          count++;
        if (left >= 0 && (currentState.cells[left][y] & rtMask) === 1) count++;
        if (
          isMoore &&
          left >= 0 &&
          down >= 0 &&
          down < height &&
          (currentState.cells[left][down] & rtMask) === 1
        )
          count++;
        if (up >= 0 && (currentState.cells[x][up] & rtMask) === 1) count++;
        if (this.ctrCell && (currentState.cells[x][y] & rtMask) === 1) count++;
        if (down >= 0 && down < height && (currentState.cells[x][down] & rtMask) === 1) count++;

        if (
          isMoore &&
          right >= 0 &&
          right < width &&
          up >= 0 &&
          (currentState.cells[right][up] & rtMask) === 1
        )
          count++;
        if (right >= 0 && right < width && (currentState.cells[right][y] & rtMask) === 1) count++;
        if (
          isMoore &&
          right >= 0 &&
          right < width &&
          down >= 0 &&
          down < height &&
          (currentState.cells[right][down] & rtMask) === 1
        )
          count++;

        // Apply rule
        const newVal = this.table[oldVal][count];
        newState.cells[x][y] = newVal;

        if (newVal !== oldVal) {
          modCount++;
        }
      }
    }

    return modCount;
  }

  // Examples:
  // "1,0,0,0,0,1,2,0,2,2,2,2,0,2,2,2,1,0,2,2,2,2,0,0,0,0,0,1,2,2,1,2"
  // "1,0,0,0,4,1,9,8,0,0,0,0,0,5,0,9,7,0,6,0,9,8,0,8,0,0,0,0,0,0,0,0,0,0,0,2,0,0,6,0,0,4,0,3,0,0,0,3,0,1,0,0,0,4,0,3,0,9,0,6,1,0,0,0,5,0,0,0,0,4,1,0,0,2,7,0,2,6,3,8,4,6,0,1,0,0,0,0,0,0,0,0,0,0,0,0,6,7,0,8,5,3"
  randomRule(): string {
    const nghTyp = Math.random() < 0.5 ? 1 : 2; // 1=Moore, 2=von Neumann
    const ctrCell = Math.random() < 0.33;
    const all1Fire = Math.random() < 0.33;
    let numStates = Math.floor(Math.random() * 16) + 2;

    let nghNum = nghTyp === 1 ? 8 : 4;
    if (ctrCell) nghNum += 1;

    let table = Array(numStates + 1)
      .fill(0)
      .map(() => Array(nghNum + 1).fill(0)); // rules table

    for (let s = 0; s <= numStates; s++) {
      for (let n = 0; n <= nghNum; n++) {
        table[s][n] = Math.floor(Math.random() * numStates) + 1;
      }
    }
    table[0][0] = 0; // safety-valve

    // trim trailing zeros
    let rule = table.join(',');
    while (rule.endsWith(',0')) {
      rule = rule.slice(0, rule.length - 2);
    }

    return `${nghTyp},${ctrCell ? 1 : 0},${all1Fire ? 1 : 0},${rule}`;
  }
}
