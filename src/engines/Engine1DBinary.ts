/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Engine1DBinary.js - 1-D Binary CA family engine
import { BaseEngine, ICaEngine, ICaEngineState } from './BaseEngine.js';
import { Lattice } from '../core/Lattice.js';
import { CaEngines } from '../core/CaEngines.js';

export class Engine1DBinary extends BaseEngine implements ICaEngine {
  static MAX_RANGE = 4;

  range = 1; // range, 1..4
  ruleArray = new Array(512).fill(0); // the rule array
  hexCode = '6E'; // Wolfram's code

  constructor() {
    super();
    this.universeType = CaEngines.UNIV_TYPE_1D;
    this.setDefaults();
  }

  setDefaults() {
    this.range = 1;
    this.hexCode = '6E';
    this.numStates = 2;
    this.ruleArray = new Array(512).fill(0);
  }

  validate() {
    if (this.range < 1) this.range = 1;
    else if (this.range > Engine1DBinary.MAX_RANGE) this.range = Engine1DBinary.MAX_RANGE;

    this.hexCode = this.hexCode.toUpperCase();
    if (this.hexCode.startsWith('W')) {
      this.hexCode = this.hexCode.substring(1);
    }
  }

  // Convert hex string to binary string
  // Ex: '6E' => '01101110'
  hexToBinary(hex: string): string {
    const hexMap: { [key: string]: string } = {
      '0': '0000',
      '1': '0001',
      '2': '0010',
      '3': '0011',
      '4': '0100',
      '5': '0101',
      '6': '0110',
      '7': '0111',
      '8': '1000',
      '9': '1001',
      A: '1010',
      B: '1011',
      C: '1100',
      D: '1101',
      E: '1110',
      F: '1111',
    };

    let binStr: string = '';
    hex = hex.toUpperCase();
    for (let i = 0; i < hex.length; i++) {
      let hexChar = hex[i];
      if (hexMap.hasOwnProperty(hexChar)) {
        binStr += hexMap[hexChar];
      }
    }

    // Remove leading zeros
    while (binStr.length > 0 && binStr[0] === '0') {
      binStr = binStr.substring(1);
    }
    return binStr;
  }

  // Convert binary string to hex string
  binaryToHex(bin: string) {
    // Pad to multiple of 4
    while (bin.length % 4 !== 0) {
      bin = '0' + bin;
    }

    let hexStr = '';
    for (let i = 0; i < bin.length; i += 4) {
      let chunk = bin.substring(i, i + 4);
      let val = 0;
      if (chunk[0] === '1') val += 8;
      if (chunk[1] === '1') val += 4;
      if (chunk[2] === '1') val += 2;
      if (chunk[3] === '1') val += 1;
      hexStr += val.toString(16).toUpperCase();
    }

    // Remove leading zeros
    while (hexStr.length > 0 && hexStr[0] === '0') {
      hexStr = hexStr.substring(1);
    }
    return hexStr;
  }

  // Prepare the rule array
  setRuleArray() {
    this.validate();

    let binStr = this.hexToBinary(this.hexCode);
    let count = Math.pow(2, 2 * this.range + 1);

    // Pad with zeros to full length
    while (binStr.length < count) {
      binStr = '0' + binStr;
    }

    // Set the rule array
    for (let i = 0; i < count; i++) {
      this.ruleArray[count - i - 1] = binStr[i] === '1' ? 1 : 0;
    }
  }

  initFromString(ruleDefinition: string) {
    this.setDefaults();
    if (!ruleDefinition) return;

    const tokens = ruleDefinition.split(',');
    tokens.forEach((token: string) => {
      const upperToken = token.toUpperCase();
      if (upperToken.startsWith('R')) {
        this.range = parseInt(upperToken.substring(1), 10);
      } else if (upperToken.startsWith('W')) {
        this.hexCode = upperToken.substring(1);
      }
    });

    this.validate();
    this.setRuleArray();
  }

  getAsString() {
    this.validate();
    return `R${this.range},W${this.hexCode}`;
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
    const oneRow = new Array(sizX + 2 * margin).fill(0);

    // Copy current row with margins
    for (let x = 0; x < sizX; x++) {
      oneRow[x + margin] = currentState.cells[x][engineState.last1DRow];
    }

    // Handle wrapping
    if (engineState.isWrap) {
      for (let i = 1; i <= margin; i++) {
        oneRow[margin - i] = oneRow[sizX - i + margin];
        oneRow[sizX - 1 + i + margin] = oneRow[margin + i - 1];
      }
    }

    // Process each cell in the row
    for (let x = 0; x < sizX; x++) {
      let power = 1;
      let index = 0;

      // Calculate neighborhood index
      for (let i = this.range; i >= -this.range; i--) {
        if (oneRow[x + i + margin] > 0) {
          index += power;
        }
        power *= 2;
      }

      // Set new state
      newState.cells[x][nextRow] = this.ruleArray[index];
    }

    engineState.last1DRow = nextRow;
    return 1;
  }

  // Examples: "R1,W5A", "R2,W1C2A4798", "R3,W3B469C0EE4F7FA96F93B4D32B09ED0E0"
  randomRule(): string {
    const range = Math.floor(Math.random() * Engine1DBinary.MAX_RANGE) + 1;
    const count = Math.pow(2, 2 * range + 1);
    const ruleArray = new Array(count).fill(0);
    for (let i = 0; i < count; i++) {
      ruleArray[i] = Math.random() > 0.66 ? 1 : 0;
    }
    const hexCode = this.binaryToHex(ruleArray.join(''));
    return `R${range},W${hexCode}`;
  }
}
