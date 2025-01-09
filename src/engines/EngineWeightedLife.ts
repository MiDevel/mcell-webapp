/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineWeightedLife.js - WeightedLife CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { Constants } from '../utils/Constants.js';

export class EngineWeightedLife extends BaseEngine implements ICaEngine {
  static readonly MAXWLIFEVAL = 32; // accept weights -32..32
  static readonly MAXWLIFERUL = 8 * this.MAXWLIFEVAL;

  private wgtAry: number[] = new Array(10);
  private rulesS: boolean[] = new Array(EngineWeightedLife.MAXWLIFERUL + 1); // rules for surviving
  private rulesB: boolean[] = new Array(EngineWeightedLife.MAXWLIFERUL + 1); // rules for birth
  private isHist: boolean = true;

  constructor() {
    super();
    this.setDefaults();
  }

  setDefaults() {
    this.wgtAry.fill(1); // weights of neighbours
    this.wgtAry[5] = 0; // center cell weight
    this.rulesS.fill(false); // rules for surviving
    this.rulesB.fill(false); // rules for birth
    this.isHist = true;
  }

  // Examples:
  //   "NW5,NN2,NE5,WW2,ME0,EE2,SW5,SS2,SE5,HI3,RS10,RS12,RS14,RS16,RB7,RB13"
  //   "NW-1,NN-1,NE5,WW5,ME0,EE5,SW5,SS-1,SE-1,HI0,RS4,RS14,RB1,RB4,RB9"
  //   "NW1,NN5,NE1,WW5,ME10,EE5,SW1,SS5,SE1,HI9,RS1,RS10,RB6,RB11,RB12,RB21"
  //   "NW0,NN1,NE0,WW1,ME0,EE1,SW0,SS1,SE0,HI25,RB1"
  //   "NW1,NN2,NE0,WW32,ME0,EE4,SW0,SS16,SE8,HI0,RS5,RS7,RS10,RS11,RS13,RS14,RS15,RS17,RS19,RS20,RS21,RS22,RS23,RS25,RS26,RS27,RS28,RS29,RS30,RS34,RS35,RS37,RS38,RS39,RS40,RS41,RS42,RS43,RS44,RS45,RS46,RS49,RS50,RS51,RS52,RS53,RS54,RS56,RS57,RS58,RS60,RB3,RB6,RB12,RB24,RB33,RB48"
  // where:
  //   NW, .. ME, .. SE - weights of all 9 neighbors, -99..99; ME is the center cell
  //   HI - history - number of states; when 0, 1, 2 or missing - no history.
  //   RS - survive total weight, may apear any number of times
  //   RB - birth total weight, may apear any number of times
  initFromString(ruleDefinition: string) {
    this.setDefaults();

    if (!ruleDefinition) return;

    this.isHist = false;
    this.numStates = 2;

    const tokens = ruleDefinition.split(',');
    for (const token of tokens) {
      const upperToken = token.trim().toUpperCase();

      if (upperToken.startsWith('NW')) this.wgtAry[1] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('NN')) this.wgtAry[2] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('NE')) this.wgtAry[3] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('WW')) this.wgtAry[4] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('ME')) this.wgtAry[5] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('EE')) this.wgtAry[6] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('SW')) this.wgtAry[7] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('SS')) this.wgtAry[8] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('SE')) this.wgtAry[9] = parseInt(upperToken.substring(2));
      else if (upperToken.startsWith('HI')) {
        const val = parseInt(upperToken.substring(2));
        if (val >= 3) {
          this.isHist = true;
          this.numStates = val;
        } else {
          this.isHist = false;
        }
      } else if (upperToken.startsWith('RS')) {
        const val = parseInt(upperToken.substring(2));
        if (val >= 0 && val <= EngineWeightedLife.MAXWLIFERUL) this.rulesS[val] = true;
      } else if (upperToken.startsWith('RB')) {
        const val = parseInt(upperToken.substring(2));
        if (val > 0 && val <= EngineWeightedLife.MAXWLIFERUL) this.rulesB[val] = true;
      }
    }

    this.validate();
  }

  getAsString() {
    this.validate();

    const historyValue = this.isHist ? this.numStates : 0;

    let result = [
      `NW${this.wgtAry[1]}`,
      `NN${this.wgtAry[2]}`,
      `NE${this.wgtAry[3]}`,
      `WW${this.wgtAry[4]}`,
      `ME${this.wgtAry[5]}`,
      `EE${this.wgtAry[6]}`,
      `SW${this.wgtAry[7]}`,
      `SS${this.wgtAry[8]}`,
      `SE${this.wgtAry[9]}`,
      `HI${historyValue}`,
    ];

    // Add survival rules
    for (let i = 0; i < EngineWeightedLife.MAXWLIFERUL; i++) {
      if (this.rulesS[i]) {
        result.push(`RS${i}`);
      }
    }

    // Add birth rules
    for (let i = 0; i < EngineWeightedLife.MAXWLIFERUL; i++) {
      if (this.rulesB[i]) {
        result.push(`RB${i}`);
      }
    }

    return result.join(',');
  }

  validate() {
    if (this.numStates < 2) this.numStates = 2;
    // You might want to add a MAX_STATES constant to BaseRule or import it from Constants.js
    else if (this.numStates > Constants.MAX_STATES) this.numStates = Constants.MAX_STATES;
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
          n = y > 0 ? currentState.cells[x][y - 1] : 0;
          s = y < sizY - 1 ? currentState.cells[x][y + 1] : 0;
          e = x < sizX - 1 ? currentState.cells[x + 1][y] : 0;
          w = x > 0 ? currentState.cells[x - 1][y] : 0;
          nw = x > 0 && y > 0 ? currentState.cells[x - 1][y - 1] : 0;
          ne = x < sizX - 1 && y > 0 ? currentState.cells[x + 1][y - 1] : 0;
          sw = x > 0 && y < sizY - 1 ? currentState.cells[x - 1][y + 1] : 0;
          se = x < sizX - 1 && y < sizY - 1 ? currentState.cells[x + 1][y + 1] : 0;
        }

        const oldValue = currentState.cells[x][y];
        let newValue = oldValue; // default - no change

        let weightSum = 0;

        if (this.isHist) {
          // with history
          if (oldValue <= 1) {
            // can survive or be born
            // Only count cells that are exactly 1 (alive)
            if (nw === 1) weightSum += this.wgtAry[1];
            if (n === 1) weightSum += this.wgtAry[2];
            if (ne === 1) weightSum += this.wgtAry[3];
            if (w === 1) weightSum += this.wgtAry[4];
            if (oldValue === 1) weightSum += this.wgtAry[5];
            if (e === 1) weightSum += this.wgtAry[6];
            if (sw === 1) weightSum += this.wgtAry[7];
            if (s === 1) weightSum += this.wgtAry[8];
            if (se === 1) weightSum += this.wgtAry[9];

            if (weightSum < 0) weightSum = 0;

            if (oldValue === 0) {
              // was dead
              if (this.rulesB[weightSum]) {
                // rules for birth
                newValue = 1; // birth
              }
            } else {
              // was 1 - alive
              if (this.rulesS[weightSum]) {
                // rules for surviving
                newValue = 1;
              } else {
                // isolation or overpopulation
                if (oldValue < this.numStates - 1) {
                  newValue = oldValue + 1; // getting older...
                } else {
                  newValue = 0; // bye, bye!
                }
              }
            }
          } else {
            // was older than 1
            if (oldValue < this.numStates - 1) {
              newValue = oldValue + 1; // getting older...
            } else {
              newValue = 0; // bye, bye!
            }
          }
        } else {
          // no history
          // Count any non-zero cells
          if (nw !== 0) weightSum += this.wgtAry[1];
          if (n !== 0) weightSum += this.wgtAry[2];
          if (ne !== 0) weightSum += this.wgtAry[3];
          if (w !== 0) weightSum += this.wgtAry[4];
          if (oldValue !== 0) weightSum += this.wgtAry[5];
          if (e !== 0) weightSum += this.wgtAry[6];
          if (sw !== 0) weightSum += this.wgtAry[7];
          if (s !== 0) weightSum += this.wgtAry[8];
          if (se !== 0) weightSum += this.wgtAry[9];

          if (weightSum < 0) weightSum = 0;

          if (oldValue === 0) {
            // was dead
            if (this.rulesB[weightSum]) {
              // rules for birth
              newValue = 1; // standard coloring method
            }
          } else {
            // was alive
            if (this.rulesS[weightSum]) {
              // rules for surviving
              if (oldValue < this.numStates - 1) {
                newValue = oldValue + 1; // getting older...
              } else {
                newValue = this.numStates - 1;
              }
            } else {
              newValue = 0; // isolation or overpopulation
            }
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
  //   "NW3,NN2,NE3,WW2,ME0,EE2,SW3,SS2,SE3,HI0,RS3,RS5,RS8,RB4,RB6,RB8"
  //   "NW1,NN5,NE1,WW5,ME10,EE5,SW1,SS5,SE1,HI9,RS1,RS10,RB6,RB11,RB12,RB21"
  // where:
  //   NW, .. ME, .. SE - weights of all 9 neighbors, -99..99; ME is the center cell
  //   HI - history - number of states; when 0, 1, 2 or missing - no history.
  //   RS - survive total weight, may apear any number of times
  //   RB - birth total weight, may apear any number of times
  randomRule(): string {
    const numStates = Math.floor(Math.random() * 16) + 2;
    const isHist: boolean = numStates > 2;
    const wgtAry: number[] = new Array(10);

    // random weights
    for (let i = 0; i < 10; i++) {
      wgtAry[i] = Math.floor(Math.random() * 16);
    }
    const isSymmetry = Math.random() < 0.5;
    if (isSymmetry) {
      wgtAry[3] = wgtAry[1]; // NE
      wgtAry[7] = wgtAry[1]; // SW
      wgtAry[9] = wgtAry[1]; // SE

      wgtAry[4] = wgtAry[2]; // WW
      wgtAry[6] = wgtAry[2]; // EE
      wgtAry[8] = wgtAry[2]; // SS
    }
    const wgtStr =
      'NW' +
      wgtAry[1] +
      ',NN' +
      wgtAry[2] +
      ',NE' +
      wgtAry[3] +
      ',WW' +
      wgtAry[4] +
      ',ME' +
      wgtAry[5] +
      ',EE' +
      wgtAry[6] +
      ',SW' +
      wgtAry[7] +
      ',SS' +
      wgtAry[8] +
      ',SE' +
      wgtAry[9];

    // random rules
    const rulesS: number[] = [];
    const numS = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < numS; i++) {
      let sumS = 0;
      for (let j = 0; j < 9; j++) {
        if (Math.random() < 0.5) {
          sumS += wgtAry[j];
        }
      }
      rulesS.push(sumS);
    }
    // sort S rules
    rulesS.sort((a, b) => a - b);

    // random S totals
    let sStr = '';
    for (let i = 0; i < rulesS.length; i++) {
      sStr += ',RS' + rulesS[i];
    }

    const rulesB: number[] = [];
    const numB = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < numB; i++) {
      let sumB = 0;
      for (let j = 0; j < 9; j++) {
        if (Math.random() < 0.5) {
          sumB += wgtAry[j];
        }
      }
      rulesB.push(sumB);
    }
    // sort B rules
    rulesB.sort((a, b) => a - b);

    // random B totals
    let bStr = '';
    for (let i = 0; i < rulesB.length; i++) {
      bStr += ',RB' + rulesB[i];
    }

    return wgtStr + ',HI' + (isHist ? numStates : 0) + sStr + bStr;
  }
}
