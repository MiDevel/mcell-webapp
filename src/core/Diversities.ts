/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Diversities.js
import { Lattice } from './Lattice';

export class DivNoise {
  active = false;
  cycles = 1;
  cells = 5;
  state = 1;
}

export class DivBlackHole {
  active = false;
  x = 0;
  y = 0;
  size = 10;
}

export class DivSuperNova {
  active = false;
  x = 0;
  y = 0;
  size = 10;
  state = 1;
}

export class DivStreamInput {
  active = false;
  repeat = true;
  x = 0;
  y = -40;
  str = [1, 0, 0, 0];
}

// All x, y are relative to the center of the board
export class DiversitiesSettings {
  enabled = false;
  noise: DivNoise = new DivNoise();
  blackHole: DivBlackHole = new DivBlackHole();
  superNova: DivSuperNova = new DivSuperNova();
  streamInput: DivStreamInput = new DivStreamInput();

  setDefaults() {
    this.enabled = false;
    this.noise = new DivNoise();
    this.blackHole = new DivBlackHole();
    this.superNova = new DivSuperNova();
    this.streamInput = new DivStreamInput();

    Diversities.streamInputPos = 0;
  }

  setSettings(settings: DiversitiesSettings) {
    this.enabled = settings.enabled;
    this.noise = settings.noise;
    this.blackHole = settings.blackHole;
    this.superNova = settings.superNova;
    this.streamInput = settings.streamInput;
    Diversities.streamInputPos = 0;
  }
}

export class Diversities {
  static DIV_NONE: number = 0;
  static DIV_SYSTEM: number = 1;
  static DIV_NOISE: number = 2;
  static DIV_BHOLE: number = 3;
  static DIV_SNOVA: number = 4;
  static DIV_STRIN: number = 5;

  settings: DiversitiesSettings = new DiversitiesSettings();

  constructor() {
    this.settings.setDefaults();
  }

  // Checks if diversities are enabled and at least one diversity is active.
  isEnabled() {
    return this.settings.enabled && Object.values(this.settings).some((div) => div.active);
  }

  // Applies a single configuration string to the current diversities settings.
  // Example configuration strings:
  //   #SYSTEM,act=1
  //   #NOISE,act=1,cycl=1,cell=3,stt=1
  //   #BHOLE,act=1,x=-30,y=-30,size=10
  //   #SNOVA,act=1,x=30,y=30,size=10,stt=1
  //   #STRIN,act=1,rep=1,x=0,y=-40,str=1;0;0;0
  applyConfigString(configString: string) {
    const configLines = configString.split('\n');
    configLines.forEach((line) => {
      const [key, ...params] = line.split(',');
      switch (key) {
        case '#SYSTEM':
          this.settings.enabled = params.some((param) => param === 'act=1');
          break;
        case '#NOISE':
          this.settings.noise = this.parseNoiseParams(params);
          break;
        case '#BHOLE':
          this.settings.blackHole = this.parseBlackHoleParams(params);
          break;
        case '#SNOVA':
          this.settings.superNova = this.parseSuperNovaParams(params);
          break;
        case '#STRIN':
          this.settings.streamInput = this.parseStreamInputParams(params);
          Diversities.streamInputPos = 0;
          break;
      }
    });
  }

  // Returns the specified diversity configuration string.
  // Example configuration strings:
  //   #SYSTEM,act=1
  //   #NOISE,act=1,cycl=1,cell=3,stt=1
  //   #BHOLE,act=1,x=-30,y=-30,size=10
  //   #SNOVA,act=1,x=30,y=30,size=10,stt=1
  //   #STRIN,act=1,rep=1,x=0,y=-40,str=1;0;0;0
  itemAsString(item: number) {
    switch (item) {
      case Diversities.DIV_SYSTEM:
        return `#SYSTEM,act=${this.settings.enabled ? 1 : 0}`;
      case Diversities.DIV_NOISE:
        return `#NOISE,act=${this.settings.noise.active ? 1 : 0},cycl=${this.settings.noise.cycles},cell=${this.settings.noise.cells},stt=${this.settings.noise.state}`;
      case Diversities.DIV_BHOLE:
        return `#BHOLE,act=${this.settings.blackHole.active ? 1 : 0},x=${this.settings.blackHole.x},y=${this.settings.blackHole.y},size=${this.settings.blackHole.size}`;
      case Diversities.DIV_SNOVA:
        return `#SNOVA,act=${this.settings.superNova.active ? 1 : 0},x=${this.settings.superNova.x},y=${this.settings.superNova.y},size=${this.settings.superNova.size},stt=${this.settings.superNova.state}`;
      case Diversities.DIV_STRIN:
        return `#STRIN,act=${this.settings.streamInput.active ? 1 : 0},rep=${this.settings.streamInput.repeat ? 1 : 0},x=${this.settings.streamInput.x},y=${this.settings.streamInput.y},str=${this.settings.streamInput.str.join(';')}`;
      default:
        return '';
    }
  }

  // Returns an array of all enabled diversity configuration strings.
  getConfigStrings(): string[] {
    const strings: string[] = [];
    if (this.settings.enabled) {
      strings.push(this.itemAsString(Diversities.DIV_SYSTEM));
      if (this.settings.noise.active) strings.push(this.itemAsString(Diversities.DIV_NOISE));
      if (this.settings.blackHole.active) strings.push(this.itemAsString(Diversities.DIV_BHOLE));
      if (this.settings.superNova.active) strings.push(this.itemAsString(Diversities.DIV_SNOVA));
      if (this.settings.streamInput.active) strings.push(this.itemAsString(Diversities.DIV_STRIN));
    }

    return strings;
  }

  parseNoiseParams(params: string[]) {
    const noise = { active: false, cycles: 1, cells: 0, state: 1 };
    params.forEach((param) => {
      const [key, value] = param.split('=');
      switch (key) {
        case 'act':
          noise.active = value === '1';
          break;
        case 'cycl':
          noise.cycles = parseInt(value, 10);
          break;
        case 'cell':
          noise.cells = parseInt(value, 10);
          break;
        case 'stt':
          noise.state = parseInt(value, 10);
          break;
      }
    });
    return noise;
  }

  parseBlackHoleParams(params: string[]) {
    const blackHole = { active: false, x: -30, y: -30, size: 10 };
    params.forEach((param) => {
      const [key, value] = param.split('=');
      switch (key) {
        case 'act':
          blackHole.active = value === '1';
          break;
        case 'x':
          blackHole.x = parseInt(value, 10);
          break;
        case 'y':
          blackHole.y = parseInt(value, 10);
          break;
        case 'size':
          blackHole.size = parseInt(value, 10);
          break;
      }
    });
    return blackHole;
  }

  parseSuperNovaParams(params: string[]) {
    const superNova = { active: false, x: 30, y: 30, size: 10, state: 1 };
    params.forEach((param) => {
      const [key, value] = param.split('=');
      switch (key) {
        case 'act':
          superNova.active = value === '1';
          break;
        case 'x':
          superNova.x = parseInt(value, 10);
          break;
        case 'y':
          superNova.y = parseInt(value, 10);
          break;
        case 'size':
          superNova.size = parseInt(value, 10);
          break;
        case 'stt':
          superNova.state = parseInt(value, 10);
          break;
      }
    });
    return superNova;
  }

  parseStreamInputParams(params: string[]) {
    const streamInput = { active: false, repeat: true, x: 0, y: -40, str: [0, 0, 0, 0] };
    params.forEach((param) => {
      const [key, value] = param.split('=');
      switch (key) {
        case 'act':
          streamInput.active = value === '1';
          break;
        case 'rep':
          streamInput.repeat = value === '1';
          break;
        case 'x':
          streamInput.x = parseInt(value, 10);
          break;
        case 'y':
          streamInput.y = parseInt(value, 10);
          break;
        case 'str':
          streamInput.str = value.split(';').map(Number);
          break;
      }
    });
    return streamInput;
  }

  // Applies all active diversities to the board.
  // Returns true if any diversity was applied.
  perform(isBeforePass: boolean, lattice: Lattice, cycle: number) {
    let result = false;
    if (!this.settings.enabled) return result;

    const { noise, blackHole, superNova, streamInput } = this.settings;

    if (blackHole.active) {
      this.applyBlackHole(lattice, blackHole);
      result = true;
    }

    if (superNova.active) {
      this.applySuperNova(lattice, superNova);
      result = true;
    }

    if (noise.active && isBeforePass && cycle % noise.cycles === 0) {
      this.applyNoise(lattice, noise);
      result = true;
    }

    if (streamInput.active && isBeforePass) {
      this.applyStreamInput(lattice, streamInput);
      result = true;
    }

    return result;
  }

  applyBlackHole(lattice: Lattice, config: DivBlackHole) {
    // x and y are relative to the center; calculate absolute
    const col = config.x + Math.floor(lattice.width / 2);
    const row = config.y + Math.floor(lattice.height / 2);

    const minX = col - Math.floor(config.size / 2);
    const minY = row - Math.floor(config.size / 2);
    for (let col = minX; col < minX + config.size; col++) {
      for (let row = minY; row < minY + config.size; row++) {
        lattice.setCell(col, row, 0);
      }
    }
  }

  applySuperNova(lattice: Lattice, config: DivSuperNova) {
    // x and y are relative to the center; calculate absolute
    const col = config.x + Math.floor(lattice.width / 2);
    const row = config.y + Math.floor(lattice.height / 2);

    const minX = col - Math.floor(config.size / 2);
    const minY = row - Math.floor(config.size / 2);
    for (let col = minX; col < minX + config.size; col++) {
      for (let row = minY; row < minY + config.size; row++) {
        lattice.setCell(col, row, config.state);
      }
    }
  }

  applyNoise(lattice: Lattice, config: DivNoise) {
    const cells = config.cells;
    const state = config.state;
    for (let i = 0; i < cells; i++) {
      const col = Math.floor(Math.random() * lattice.width);
      const row = Math.floor(Math.random() * lattice.height);
      lattice.setCell(col, row, state);
    }
  }

  static streamInputPos: number = 0;
  applyStreamInput(lattice: Lattice, config: DivStreamInput) {
    // x and y are relative to the center; calculate absolute
    const col = config.x + Math.floor(lattice.width / 2);
    const row = config.y + Math.floor(lattice.height / 2);

    if (config.str.length === 0) return;
    if (!config.repeat && Diversities.streamInputPos >= config.str.length) return;
    if (config.repeat) Diversities.streamInputPos = Diversities.streamInputPos % config.str.length;

    const value: number = config.str[Diversities.streamInputPos];
    lattice.setCell(col, row, value);

    Diversities.streamInputPos = Diversities.streamInputPos + 1;
  }
}

export const diversities = new Diversities();
