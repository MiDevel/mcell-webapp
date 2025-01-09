/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineNeumannBinary.js - Neumann binary CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';

export class EngineNeumannBinary extends BaseEngine implements ICaEngine {
  static MAX_STATES = 3;

  // 5D array for states[center][up][right][down][left]
  states: number[][][][][];

  constructor() {
    super();

    this.states = Array(EngineNeumannBinary.MAX_STATES)
      .fill(0)
      .map(() =>
        Array(EngineNeumannBinary.MAX_STATES)
          .fill(0)
          .map(() =>
            Array(EngineNeumannBinary.MAX_STATES)
              .fill(0)
              .map(() =>
                Array(EngineNeumannBinary.MAX_STATES)
                  .fill(0)
                  .map(() => Array(EngineNeumannBinary.MAX_STATES).fill(0))
              )
          )
      );

    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 3; // count of states
    // Reset all states to 0
    for (let i = 0; i < EngineNeumannBinary.MAX_STATES; i++)
      for (let j = 0; j < EngineNeumannBinary.MAX_STATES; j++)
        for (let k = 0; k < EngineNeumannBinary.MAX_STATES; k++)
          for (let l = 0; l < EngineNeumannBinary.MAX_STATES; l++)
            for (let m = 0; m < EngineNeumannBinary.MAX_STATES; m++) this.states[i][j][k][l][m] = 0;
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;
    else if (this.numStates > EngineNeumannBinary.MAX_STATES)
      this.numStates = EngineNeumannBinary.MAX_STATES;
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();
    if (!ruleDefinition || ruleDefinition.length < 1) return;

    let pos = 0;
    this.numStates = parseInt(ruleDefinition[pos++]);
    this.validate();

    for (let i = 0; i < this.numStates; i++)
      for (let j = 0; j < this.numStates; j++)
        for (let k = 0; k < this.numStates; k++)
          for (let l = 0; l < this.numStates; l++)
            for (let m = 0; m < this.numStates; m++) {
              if (pos < ruleDefinition.length) {
                let state = parseInt(ruleDefinition[pos++]);
                if (state >= 0 && state < EngineNeumannBinary.MAX_STATES) {
                  this.states[i][j][k][l][m] = state;
                }
              }
            }
  }

  getAsString(): string {
    this.validate();
    let result = this.numStates.toString();

    for (let i = 0; i < this.numStates; i++)
      for (let j = 0; j < this.numStates; j++)
        for (let k = 0; k < this.numStates; k++)
          for (let l = 0; l < this.numStates; l++)
            for (let m = 0; m < this.numStates; m++) {
              result += this.states[i][j][k][l][m].toString();
            }

    return result;
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modCount = 0;

    for (let j = 0; j < sizY; j++) {
      for (let i = 0; i < sizX; i++) {
        // determine left and right cells
        const left = i > 0 ? i - 1 : engineState.isWrap ? sizX - 1 : i;
        const right = i < sizX - 1 ? i + 1 : engineState.isWrap ? 0 : i;

        // determine up and down cells
        const up = j > 0 ? j - 1 : engineState.isWrap ? sizY - 1 : j;
        const down = j < sizY - 1 ? j + 1 : engineState.isWrap ? 0 : j;

        const oldVal = this.normalizeState(currentState.cells[i][j]);

        // Get neighbor states, using current cell's state for out-of-bounds
        const l = this.normalizeState(currentState.cells[left][j]);
        const u = this.normalizeState(currentState.cells[i][up]);
        const r = this.normalizeState(currentState.cells[right][j]);
        const d = this.normalizeState(currentState.cells[i][down]);

        // Calculate new state
        const newVal = this.states[oldVal][u][r][d][l];
        newState.cells[i][j] = newVal;

        if (newVal !== oldVal) {
          modCount++;
        }
      }
    }

    return modCount;
  }

  normalizeState(state: number): number {
    if (state < 0) return 0;
    if (state >= this.numStates) return this.numStates - 1;
    return state;
  }

  // Examples:
  // "201101101101101101111101011001000"
  // "3010112020112110202020202020112110202110102020202020202020202020202020202020202020112102222102000200222200202102000200000002020200020000222200202200020000202000200020220000220222020000020000220222020222222222020222020000020000020222020000020000"
  randomRule(): string {
    const numStates = Math.floor(Math.random() * 2) + 2; // 2 or 3

    let ret = numStates.toString(); // numStates
    let num = numStates ** 5; // 32 or 243
    for (let i = 0; i < num; i++) {
      ret += Math.floor(Math.random() * numStates).toString(); // 0 or 1 or 2
    }
    return ret;
  }
}
