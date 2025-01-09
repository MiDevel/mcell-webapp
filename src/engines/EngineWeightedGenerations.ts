/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineWeightedGenerations.js - Generations with weights CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';

export class EngineWeightedGenerations extends BaseEngine implements ICaEngine {
  static readonly MAX_STATES = 16;
  static readonly MAX_WEIGHT = 10;

  private stateWeights: number[] = new Array(EngineWeightedGenerations.MAX_STATES);
  private posWeights: number[] = new Array(8);
  private rulesS: number[] = []; // rules for surviving, any number
  private rulesB: number[] = []; // rules for birth, any number

  constructor() {
    super();
    this.setDefaults();
  }

  setDefaults() {
    this.stateWeights.fill(0);
    this.posWeights.fill(1);
    this.rulesS = [];
    this.rulesB = [];
  }

  // Examples:
  //   WeightedGen,C5,SW0;2;1;0;1,PW1;1;1;1;1;1;1;1,RS4;5;6;7;8,RB6
  //   WeightedGen,C7,SW0;3;1;4;2;3;1,PW1;1;1;1;1;1;1;1,RS4;6;8;10;12,RB7
  //   WeightedGen,C16,SW0;3;1;4;2;3;1;0;0;0;0;1;0;1;1;2,PW1;1;1;1;1;1;1;1,RS4;6;8;10;12,RB7
  // where:
  //   C - number of states; 2..16
  //   SW - State weights; 0..10
  //   PW - Position Weights, weights of all 8 neighbors; 0..10
  //   RS - survive total weights, may contain any number of items
  //   RB - birth total weights, may contain any number of items
  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (!ruleDefinition) return;

    this.numStates = 2;

    const tokens = ruleDefinition.split(',');
    for (const token of tokens) {
      const upperToken = token.trim().toUpperCase();
      if (upperToken.charAt(0) === 'C') {
        const val = parseInt(upperToken.substring(1));
        if (val >= 2) {
          this.numStates = val;
        }
      } else if (upperToken.startsWith('SW'))
        this.stateWeights = upperToken
          .substring(2)
          .split(';')
          .map((t) => parseInt(t, 10));
      else if (upperToken.startsWith('PW'))
        this.posWeights = upperToken
          .substring(2)
          .split(';')
          .map((t) => parseInt(t, 10));
      else if (upperToken.startsWith('RS'))
        this.rulesS = upperToken
          .substring(2)
          .split(';')
          .map((t) => parseInt(t, 10));
      else if (upperToken.startsWith('RB'))
        this.rulesB = upperToken
          .substring(2)
          .split(';')
          .map((t) => parseInt(t, 10));
    }

    this.validate();
  }

  getAsString() {
    this.validate();

    let result = `WeightedGen,C${this.numStates}`;
    result += `,SW${this.stateWeights.join(';')}`;
    result += `,PW${this.posWeights.join(';')}`;
    result += `,RS${this.rulesS.join(';')}`;
    result += `,RB${this.rulesB.join(';')}`;

    return result;
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;
    else if (this.numStates > EngineWeightedGenerations.MAX_STATES)
      this.numStates = EngineWeightedGenerations.MAX_STATES;
  }

  private calcWeight(cellState: number, position: number) {
    return this.posWeights[position] * this.stateWeights[cellState];
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modifiedCells = 0;

    let nw,
      ne,
      sw,
      se,
      n,
      s,
      e,
      w: number = 0;
    for (let x = 0; x < sizX; x++) {
      for (let y = 0; y < sizY; y++) {
        if (engineState.isWrap) {
          n = currentState.cells[x][(y - 1 + sizY) % sizY];
          s = currentState.cells[x][(y + 1) % sizY];
          e = currentState.cells[(x + 1) % sizX][y];
          w = currentState.cells[(x - 1 + sizX) % sizX][y];
          nw = currentState.cells[(x - 1 + sizX) % sizX][(y - 1 + sizY) % sizY];
          ne = currentState.cells[(x + 1) % sizX][(y - 1 + sizY) % sizY];
          sw = currentState.cells[(x - 1 + sizX) % sizX][(y + 1) % sizY];
          se = currentState.cells[(x + 1) % sizX][(y + 1) % sizY];
        } else {
          nw = x > 0 && y > 0 ? currentState.cells[x - 1][y - 1] : 0;
          ne = x < sizX - 1 && y > 0 ? currentState.cells[x + 1][y - 1] : 0;
          sw = x > 0 && y < sizY - 1 ? currentState.cells[x - 1][y + 1] : 0;
          se = x < sizX - 1 && y < sizY - 1 ? currentState.cells[x + 1][y + 1] : 0;
          n = y > 0 ? currentState.cells[x][y - 1] : 0;
          s = y < sizY - 1 ? currentState.cells[x][y + 1] : 0;
          e = x < sizX - 1 ? currentState.cells[x + 1][y] : 0;
          w = x > 0 ? currentState.cells[x - 1][y] : 0;
        }

        const oldValue = currentState.cells[x][y];
        let newValue = 0;

        let weightSum = 0;
        weightSum += this.calcWeight(nw, 0);
        weightSum += this.calcWeight(n, 1);
        weightSum += this.calcWeight(ne, 2);
        weightSum += this.calcWeight(w, 3);
        weightSum += this.calcWeight(e, 4);
        weightSum += this.calcWeight(sw, 5);
        weightSum += this.calcWeight(s, 6);
        weightSum += this.calcWeight(se, 7);

        let processed: Boolean = false;
        if (oldValue === 0) {
          // dead cell, check birth rules
          for (let i = 0; i < this.rulesB.length; i++) {
            if (weightSum === this.rulesB[i]) {
              newValue = 1;
              processed = true;
              break;
            }
          }
        } else if (oldValue === 1) {
          // alive cell, check survive rules
          for (let i = 0; i < this.rulesS.length; i++) {
            if (weightSum === this.rulesS[i]) {
              newValue = 1;
              processed = true;
              break;
            }
          }
        }

        if (!processed) {
          if (oldValue > 0 && oldValue < this.numStates - 1) {
            newValue = oldValue + 1;
          }
        }

        newState.cells[x][y] = newValue;
        if (newValue !== oldValue) {
          modifiedCells++;
        }
      }
    }

    return modifiedCells;
  }

  // Examples:
  //   WeightedGen,C5,SW0;2;1;0;1,PW1;1;1;1;1;1;1;1,RS4;5;6;7;8,RB6
  //   WeightedGen,C7,SW0;3;1;4;2;3;1,PW1;1;1;1;1;1;1;1,RS4;6;8;10;12,RB7
  //   WeightedGen,C16,SW0;3;1;4;2;3;1;0;0;0;0;1;0;1;1;2,PW1;1;1;1;1;1;1;1,RS4;6;8;10;12,RB7
  // where:
  //   C - number of states; 2..16
  //   SW - State weights; 0..10
  //   PW - Position Weights, weights of all 8 neighbors; 0..10
  //   RS - survive total weights, may contain any number of items
  //   RB - birth total weights, may contain any number of items
  randomRule(): string {
    const numStates = Math.floor(Math.random() * 16) + 2;
    const stateWeights = Array.from({ length: numStates }, () => Math.floor(Math.random() * 11));
    const positionWeights = Array.from({ length: 8 }, () => Math.floor(Math.random() * 11));
    const surviveWeights = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, () =>
      Math.floor(Math.random() * 101)
    );
    const birthWeights = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, () =>
      Math.floor(Math.random() * 101)
    );

    return `WeightedGen,C${numStates},SW${stateWeights.join(';')},PW${positionWeights.join(';')},RS${surviveWeights.join(';')},RB${birthWeights.join(';')}`;
  }
}
