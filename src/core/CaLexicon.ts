/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// CaLexicon.js - Lexicon of all supported CA rules
import { CaEngines, caEngines } from './CaEngines.js';
import { RuleUtils } from '../utils/RuleUtils.js';

// Singleton instance
let instance: CaLexicon | null = null;

export class CaLexiconEntry {
  familyCode: string;
  ruleDefinition: string;
  ruleName: string;
  ruleCharacter: string = '';
  ruleDescription: string = '';

  constructor(
    familyCode: string,
    ruleDefinition: string,
    ruleName: string,
    ruleCharacter: string = '??',
    ruleDescription: string = '??'
  ) {
    this.familyCode = familyCode;
    this.ruleDefinition = ruleDefinition;
    this.ruleName = ruleName;
    this.ruleCharacter = ruleCharacter;
    this.ruleDescription = ruleDescription;
  }
}

export class CaLexicon {
  lexicon: CaLexiconEntry[] = [];

  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;
  }

  addEntry(
    familyCode: string,
    ruleDefinition: string,
    ruleName: string,
    ruleCharacter: string = '',
    ruleDescription: string = ''
  ) {
    this.lexicon.push(
      new CaLexiconEntry(familyCode, ruleDefinition, ruleName, ruleCharacter, ruleDescription)
    );
  }

  getEntry(familyCode: string, ruleDefinition: string) {
    // In case of Life family we need to normalize the rule definition
    if (familyCode === CaEngines.FAMILY_LIFE) {
      ruleDefinition = RuleUtils.normalizeLifeRuleSyntax(ruleDefinition);
    }

    return this.lexicon.find(
      (entry: CaLexiconEntry) =>
        entry.familyCode === familyCode && entry.ruleDefinition === ruleDefinition
    );
  }

  getEntries(familyCode: string) {
    return this.lexicon.filter((entry: CaLexiconEntry) => entry.familyCode === familyCode);
  }

  addDefaultEntries() {
    this.lexicon = [];
    this.addEntry(CaEngines.FAMILY_LIFE, '23/3', '', "Conway's Life");
    this.addEntry(CaEngines.FAMILY_LIFE, '34678/3678', '', 'Day & Night');
    this.addEntry(CaEngines.FAMILY_LIFE, '5678/35678', '', 'Diamoeba');
    this.addEntry(CaEngines.FAMILY_GENERATIONS, '345/2/4', '', 'StarWars');
    this.addEntry(CaEngines.FAMILY_GENERATIONS, '/2/3', '', "Brian's Brain");
    this.addEntry(CaEngines.FAMILY_GENERATIONS, '124567/378/4', '', 'Caterpillars');
    this.addEntry(CaEngines.FAMILY_GENERATIONS, '345/24/25', '', 'Bombers');
    this.addEntry(
      CaEngines.FAMILY_WEIGHTED_LIFE,
      'NW5,NN2,NE5,WW2,ME0,EE2,SW5,SS2,SE5,HI3,RS10,RS12,RS14,RS16,RB7,RB13',
      '',
      'Bricks'
    );
    this.addEntry(
      CaEngines.FAMILY_WEIGHTED_LIFE,
      'NW3,NN2,NE3,WW2,ME0,EE2,SW3,SS2,SE3,HI0,RS3,RS5,RS8,RB4,RB6,RB8',
      '',
      "Ben's Rule"
    );
  }

  async loadRulesFromFile() {
    this.lexicon = [];
    try {
      const response = await fetch('data/rules.txt');
      if (!response.ok) {
        throw new Error(`loadRulesFromFile error! status: ${response.status}`);
      }
      const text = await response.text();

      let currentFamilyCode: string = '';

      text.split('\n').forEach((line) => {
        line = line.trim();
        if (!line || line.startsWith('//')) return; // Skip empty lines and comments

        if (line.startsWith('#')) {
          const code = line.substring(1);
          caEngines.engines.forEach((engine) => {
            if (engine.code === code) {
              currentFamilyCode = code;
              return;
            }
          });
        } else if (currentFamilyCode) {
          const [ruleName, ruleDefinition, ruleCharacter, ruleDescription] = line
            .split('||')
            .map((s) => s.trim());
          if (ruleName && ruleDefinition) {
            // replace all {NL} with \n in description
            let description = ruleDescription.replace(/\{NL\}/g, '\n');
            this.addEntry(currentFamilyCode, ruleDefinition, ruleName, ruleCharacter, description);
          }
        }
      });
    } catch (error) {
      console.error('Error loading rules file:', error);
      // If file loading fails, load the default entries
      this.addDefaultEntries();
    }
  }
}
