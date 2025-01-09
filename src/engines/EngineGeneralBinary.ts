/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// EngineGeneralBinary.js - General Binary CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { CaEngines } from '../core/CaEngines.js';

export class EngineGeneralBinary extends BaseEngine implements ICaEngine {
  isHistory = false;
  neighborhoodType = CaEngines.NGHTYP_MOOR; // default - Moore neighborhood
  rulesS = new Array(256).fill(false);
  rulesB = new Array(256).fill(false);

  constructor() {
    super();
    this.setDefaults();
  }

  setDefaults() {
    this.numStates = 2;
    this.isHistory = false;
    this.neighborhoodType = CaEngines.NGHTYP_MOOR;
    this.rulesS.fill(false);
    this.rulesB.fill(false);
  }

  expandString(str: string) {
    let result = '';
    let num = 0;
    str = str.trim();

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (!isNaN(parseInt(char))) {
        num = num * 10 + parseInt(char);
      } else {
        if (num === 0) num = 1;
        if (char === 'a' || char === 'b') {
          result += (char === 'a' ? '0' : '1').repeat(num);
          num = 0;
        }
      }
    }
    return result;
  }

  compactString(str: string): string {
    let result = '';
    let lastChar = -1;
    let count = 0;

    const addToken = (val: number, cnt: number) => {
      if (cnt <= 0) return '';
      const chr = val === 0 ? 'a' : 'b';
      if (cnt === 1) return chr;
      if (cnt === 2) return chr + chr;
      return cnt.toString() + chr;
    };

    for (let i = 0; i < str.length; i++) {
      const thisChar = parseInt(str[i]);
      if (thisChar !== lastChar) {
        result += addToken(lastChar, count);
        lastChar = thisChar;
        count = 1;
      } else {
        count++;
      }
    }
    return result + addToken(lastChar, count);
  }

  initFromString(ruleDefinition: string) {
    // Reset to defaults
    this.isHistory = false;
    this.neighborhoodType = CaEngines.NGHTYP_MOOR;
    this.rulesS.fill(false);
    this.rulesB.fill(false);

    const tokens = ruleDefinition.split(',');

    for (const token of tokens) {
      if (token.startsWith('S')) {
        const survivalStr = this.expandString(token.substring(1));
        for (let i = 0; i < Math.min(survivalStr.length, 256); i++) {
          this.rulesS[i] = survivalStr[i] === '1';
        }
      } else if (token.startsWith('B')) {
        const birthStr = this.expandString(token.substring(1));
        for (let i = 0; i < Math.min(birthStr.length, 256); i++) {
          this.rulesB[i] = birthStr[i] === '1';
        }
      } else if (token.startsWith('C')) {
        const states = parseInt(token.substring(1));
        if (states >= 3) {
          this.isHistory = true;
          this.numStates = states;
        } else {
          this.isHistory = false;
        }
      } else if (token === 'NM') {
        this.neighborhoodType = CaEngines.NGHTYP_MOOR;
      } else if (token === 'NN') {
        this.neighborhoodType = CaEngines.NGHTYP_NEUM;
      }
    }
  }

  getAsString() {
    // States
    let result = 'C' + (this.isHistory ? this.numStates : '0');

    // Neighborhood
    result += ',' + (this.neighborhoodType === CaEngines.NGHTYP_NEUM ? 'NN' : 'NM');

    // Maximum index based on neighborhood type
    const maxIdx = this.neighborhoodType === CaEngines.NGHTYP_NEUM ? 15 : 255;

    // Survivals
    let survivalStr = '';
    for (let i = 0; i <= maxIdx; i++) {
      survivalStr += this.rulesS[i] ? '1' : '0';
    }
    result += ',S' + this.compactString(survivalStr);

    // Births
    let birthStr = '';
    for (let i = 0; i <= maxIdx; i++) {
      birthStr += this.rulesB[i] ? '1' : '0';
    }
    result += ',B' + this.compactString(birthStr);

    return result;
  }

  onePass(currentState: Lattice, newState: Lattice, engineState: ICaEngineState): number {
    let sizX: number = currentState.width;
    let sizY: number = currentState.height;
    let modCount = 0;

    for (let row = 0; row < sizY; row++) {
      const up = row > 0 ? row - 1 : engineState.isWrap ? sizY - 1 : -1;
      const down = row < sizY - 1 ? row + 1 : engineState.isWrap ? 0 : -1;

      for (let col = 0; col < sizX; col++) {
        const left = col > 0 ? col - 1 : engineState.isWrap ? sizX - 1 : -1;
        const right = col < sizX - 1 ? col + 1 : engineState.isWrap ? 0 : -1;

        const oldVal = currentState.cells[col][row];
        let newVal = oldVal;

        let neighborCount = 0;

        if (this.isHistory) {
          if (oldVal <= 1) {
            if (this.neighborhoodType === CaEngines.NGHTYP_MOOR) {
              if (up >= 0 && currentState.cells[col][up] === 1) neighborCount += 1;
              if (up >= 0 && right >= 0 && currentState.cells[right][up] === 1) neighborCount += 2;
              if (right >= 0 && currentState.cells[right][row] === 1) neighborCount += 4;
              if (down >= 0 && right >= 0 && currentState.cells[right][down] === 1)
                neighborCount += 8;
              if (down >= 0 && currentState.cells[col][down] === 1) neighborCount += 16;
              if (down >= 0 && left >= 0 && currentState.cells[left][down] === 1)
                neighborCount += 32;
              if (left >= 0 && currentState.cells[left][row] === 1) neighborCount += 64;
              if (up >= 0 && left >= 0 && currentState.cells[left][up] === 1) neighborCount += 128;
            } else {
              if (up >= 0 && currentState.cells[col][up] === 1) neighborCount += 1;
              if (right >= 0 && currentState.cells[right][row] === 1) neighborCount += 2;
              if (down >= 0 && currentState.cells[col][down] === 1) neighborCount += 4;
              if (left >= 0 && currentState.cells[left][row] === 1) neighborCount += 8;
            }

            if (oldVal === 0) {
              if (this.rulesB[neighborCount]) {
                newVal = 1;
              }
            } else {
              if (this.rulesS[neighborCount]) {
                newVal = 1;
              } else if (oldVal < this.numStates - 1) {
                newVal = oldVal + 1;
              } else {
                newVal = 0;
              }
            }
          } else {
            if (oldVal < this.numStates - 1) {
              newVal = oldVal + 1;
            } else {
              newVal = 0;
            }
          }
        } else {
          if (this.neighborhoodType === CaEngines.NGHTYP_MOOR) {
            if (up >= 0 && currentState.cells[col][up] !== 0) neighborCount += 1;
            if (up >= 0 && right >= 0 && currentState.cells[right][up] !== 0) neighborCount += 2;
            if (right >= 0 && currentState.cells[right][row] !== 0) neighborCount += 4;
            if (down >= 0 && right >= 0 && currentState.cells[right][down] !== 0)
              neighborCount += 8;
            if (down >= 0 && currentState.cells[col][down] !== 0) neighborCount += 16;
            if (down >= 0 && left >= 0 && currentState.cells[left][down] !== 0) neighborCount += 32;
            if (left >= 0 && currentState.cells[left][row] !== 0) neighborCount += 64;
            if (up >= 0 && left >= 0 && currentState.cells[left][up] !== 0) neighborCount += 128;
          } else {
            if (up >= 0 && currentState.cells[col][up] !== 0) neighborCount += 1;
            if (right >= 0 && currentState.cells[right][row] !== 0) neighborCount += 2;
            if (down >= 0 && currentState.cells[col][down] !== 0) neighborCount += 4;
            if (left >= 0 && currentState.cells[left][row] !== 0) neighborCount += 8;
          }

          if (oldVal === 0) {
            if (this.rulesB[neighborCount]) {
              newVal = 1;
            }
          } else {
            if (this.rulesS[neighborCount]) {
              if (oldVal < this.numStates - 1) {
                newVal = oldVal + 1;
              } else {
                newVal = this.numStates - 1;
              }
            } else {
              newVal = 0;
            }
          }
        }

        newState.cells[col][row] = newVal;
        if (newVal !== oldVal) {
          modCount++;
        }
      }
    }

    return modCount;
  }

  private randomBinStr = (size: number): string => {
    const binArr = [];
    for (let i = 0; i < size; i++) {
      binArr.push(Math.random() > 0.75 ? '1' : '0');
    }
    return binArr.join('');
  };

  // Examples: "C0,NN,S3babbabbabba3b,B7ab3aba3b", "C48,NM,Sb255a,Babb189ab63a"
  randomRule(): string {
    const numStates = Math.floor(Math.random() * 16) + 2;
    const isMoore = Math.random() < 0.5;
    const maxIdx = isMoore ? 15 : 255;
    let sBinStr = this.randomBinStr(maxIdx + 1);
    let bBinStr = this.randomBinStr(maxIdx + 1);
    const sStr = this.compactString(sBinStr);
    const bStr = this.compactString(bBinStr);

    return `C${numStates < 3 ? '0' : numStates},${isMoore ? 'NM' : 'NN'},S${sStr},B${bStr}`;
  }
}
