/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineMargolus.js - Margolus CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';

export class EngineMargolus extends BaseEngine implements ICaEngine {
  swapArray = new Array(16).fill(0);

  constructor() {
    super();

    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 2;
    for (let i = 0; i <= 15; i++) {
      this.swapArray[i] = i;
    }
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();

    const parts = ruleDefinition.split(',');
    for (const part of parts) {
      if (part.startsWith('M')) {
        // Currently only simple Margolus is supported
        continue;
      } else if (part.startsWith('D')) {
        const values = part.substring(1).split(';');
        for (let i = 0; i < Math.min(values.length, 16); i++) {
          const val = parseInt(values[i]);
          if (!isNaN(val) && val >= 0 && val <= 15) {
            this.swapArray[i] = val;
          }
        }
      }
    }

    this.validate();
  }

  getAsString() {
    this.validate();

    let result = 'MS,D';
    result += this.swapArray.join(';');

    return result;
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;

    for (let i = 0; i <= 15; i++) {
      if (this.swapArray[i] < 0 || this.swapArray[i] > 15) {
        this.swapArray[i] = i;
      }
    }
  }

  swapMargCells(mgCells: number[]) {
    // if at least 1 cell is > 1 then the location is locked
    if (mgCells[0] < 2 && mgCells[1] < 2 && mgCells[2] < 2 && mgCells[3] < 2) {
      let iCnt = 0;
      if (mgCells[0] > 0) iCnt += 1;
      if (mgCells[1] > 0) iCnt += 2;
      if (mgCells[2] > 0) iCnt += 4;
      if (mgCells[3] > 0) iCnt += 8;

      const iNewCnt = this.swapArray[iCnt];

      mgCells[0] = (iNewCnt & 1) > 0 ? 1 : 0;
      mgCells[1] = (iNewCnt & 2) > 0 ? 1 : 0;
      mgCells[2] = (iNewCnt & 4) > 0 ? 1 : 0;
      mgCells[3] = (iNewCnt & 8) > 0 ? 1 : 0;
    }
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modCnt = 0;
    const mgCells = new Array(4); // Margolus neighborhood - 2x2 block
    const mgCellsOld = new Array(4);
    const isOdd = engineState.cycle % 2 !== 0;

    // todo: implement no-wrap as well
    let i = isOdd ? -1 : 0;
    while (i < sizX) {
      const c1 = i < 0 ? sizX - 1 : i;
      const c2 = i + 1 >= sizX ? 0 : i + 1;

      let j = isOdd ? -1 : 0;
      while (j < sizY) {
        const r1 = j < 0 ? sizY - 1 : j;
        const r2 = j + 1 >= sizY ? 0 : j + 1;

        // Note: We're using [row][col] instead of [col][row] as per codebase standard
        mgCellsOld[0] = mgCells[0] = newState.cells[c1][r1] = currentState.cells[c1][r1]; // ul
        mgCellsOld[1] = mgCells[1] = newState.cells[c2][r1] = currentState.cells[c2][r1]; // ur
        mgCellsOld[2] = mgCells[2] = newState.cells[c1][r2] = currentState.cells[c1][r2]; // ll
        mgCellsOld[3] = mgCells[3] = newState.cells[c2][r2] = currentState.cells[c2][r2]; // lr

        if (mgCells[0] + mgCells[1] + mgCells[2] + mgCells[3] > 0 || this.swapArray[0] > 0) {
          this.swapMargCells(mgCells);

          for (let ic = 0; ic <= 3; ic++) {
            if (mgCellsOld[ic] !== mgCells[ic]) {
              modCnt++;
              switch (ic) {
                case 0:
                  newState.cells[c1][r1] = mgCells[ic];
                  break; // ul
                case 1:
                  newState.cells[c2][r1] = mgCells[ic];
                  break; // ur
                case 2:
                  newState.cells[c1][r2] = mgCells[ic];
                  break; // ll
                case 3:
                  newState.cells[c2][r2] = mgCells[ic];
                  break; // lr
              }
            }
          }
        }
        j += 2;
      }
      i += 2;
    }

    if (modCnt === 0) modCnt = 1;
    return modCnt;
  }

  // Examples: "MS,D0;8;4;3;2;5;9;7;1;6;10;11;12;13;14;15", "MS,D15;1;2;3;4;5;6;7;8;9;10;11;12;13;14;0"
  randomRule(): string {
    let arr = new Array(16).fill(0);
    for (let i = 0; i <= 15; i++) {
      if (Math.random() < 0.6) arr[i] = i;
      else arr[i] = Math.floor(Math.random() * 16);
    }

    return `MS,D${arr.join(';')}`;
  }
}
