/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// CaEngines.js - list of all supported cellular automata rules engines
import { EngineLife } from '../engines/EngineLife.js';
import { EngineGenerations } from '../engines/EngineGenerations.js';
import { EngineWeightedLife } from '../engines/EngineWeightedLife.js';
import { EngineRulesTable } from '../engines/EngineRulesTable.js';
import { EngineCyclicCA } from '../engines/EngineCyclicCA.js';
import { EngineLargerThanLife } from '../engines/EngineLargerThanLife.js';
import { EngineNeumannBinary } from '../engines/EngineNeumannBinary.js';
import { EngineGeneralBinary } from '../engines/EngineGeneralBinary.js';
import { EngineMargolus } from '../engines/EngineMargolus.js';
import { Engine1DTotalistic } from '../engines/Engine1DTotalistic.js';
import { Engine1DBinary } from '../engines/Engine1DBinary.js';
import { EngineVoteForLife } from '../engines/EngineVoteForLife.js';
import { EngineWeightedGenerations } from '../engines/EngineWeightedGenerations.js';

export class CaEngines {
  // Supported CA Families
  static FAMILY_LIFE = 'Life';
  static FAMILY_GENERATIONS = 'Generations';
  static FAMILY_WEIGHTED_LIFE = 'Weighted Life';
  static FAMILY_RULES_TABLE = 'Rules table';
  static FAMILY_CYCLIC_CA = 'Cyclic CA';
  static FAMILY_LARGER_THAN_LIFE = 'Larger than Life';
  static FAMILY_NEUMANN_BINARY = 'Neumann binary';
  static FAMILY_GENERAL_BINARY = 'General binary';
  static FAMILY_MARGOLUS = 'Margolus';
  static FAMILY_ONE_D_TOTALISTIC = '1-D totalistic';
  static FAMILY_ONE_D_BINARY = '1-D binary';
  static FAMILY_VOTE = 'Vote for Life';
  static FAMILY_WEIGHTED_GENERATIONS = 'Weighted Generations';

  // Universe types
  static UNIV_TYPE_1D = 1; // 1-dimensional
  static UNIV_TYPE_2D = 2; // 2-dimensional

  // Neighborhood types
  static NGHTYP_MOOR = 'MOORE';
  static NGHTYP_NEUM = 'NEUMANN';

  engines: Array<{
    code: string;
    engine: any;
  }>;

  constructor() {
    // List of CA Rules' engines
    this.engines = [
      { code: CaEngines.FAMILY_LIFE, engine: new EngineLife() },
      { code: CaEngines.FAMILY_GENERATIONS, engine: new EngineGenerations() },
      { code: CaEngines.FAMILY_WEIGHTED_LIFE, engine: new EngineWeightedLife() },
      { code: CaEngines.FAMILY_RULES_TABLE, engine: new EngineRulesTable() },
      { code: CaEngines.FAMILY_CYCLIC_CA, engine: new EngineCyclicCA() },
      { code: CaEngines.FAMILY_LARGER_THAN_LIFE, engine: new EngineLargerThanLife() },
      { code: CaEngines.FAMILY_NEUMANN_BINARY, engine: new EngineNeumannBinary() },
      { code: CaEngines.FAMILY_GENERAL_BINARY, engine: new EngineGeneralBinary() },
      { code: CaEngines.FAMILY_MARGOLUS, engine: new EngineMargolus() },
      { code: CaEngines.FAMILY_ONE_D_TOTALISTIC, engine: new Engine1DTotalistic() },
      { code: CaEngines.FAMILY_ONE_D_BINARY, engine: new Engine1DBinary() },
      { code: CaEngines.FAMILY_VOTE, engine: new EngineVoteForLife() },
      { code: CaEngines.FAMILY_WEIGHTED_GENERATIONS, engine: new EngineWeightedGenerations() },
    ];
  }

  getEngineForFamily(familyCode: string) {
    let engine = this.engines.find((e) => e.code === familyCode)?.engine;
    if (!engine) {
      engine = this.engines[0].engine;
    }

    return engine;
  }

  isValidFamilyCode(familyCode: string) {
    return this.engines.map((family) => family.code).includes(familyCode);
  }

  getValidFamilyCode(familyCode: string) {
    return this.isValidFamilyCode(familyCode) ? familyCode : CaEngines.FAMILY_LIFE;
  }
}

export const caEngines = new CaEngines();
