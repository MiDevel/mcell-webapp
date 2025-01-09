/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// BaseRule.js
import { Lattice } from '../core/Lattice.js';
import { CaEngines } from '../core/CaEngines.js';

// CA Engine runtime state interface
export interface ICaEngineState {
  isWrap: boolean; // Wrap around the edges
  cycle: number; // Current cycle
  last1DRow: number; // Track the last processed row of 1-D CA
}

// CA Engine interface
export interface ICaEngine {
  ruleName: string;
  ruleDefinition: string;
  numStates: number;
  universeType: number;

  setDefaults(): void;
  initFromString(ruleDefinition: string): void;
  getAsString(): string;
  onePass(lattice: Lattice, newLattice: Lattice, engineState: ICaEngineState): number;
  randomRule(): string;
}

// Base data every engine needs.
export class BaseEngine {
  ruleName: string = '';
  ruleDefinition: string = '';
  numStates: number = 2;
  universeType: number = CaEngines.UNIV_TYPE_2D;

  constructor() {
    this.ruleName = '';
    this.ruleDefinition = '';
    this.numStates = 2;
    this.universeType = CaEngines.UNIV_TYPE_2D; // most rules are 2D
  }
}
