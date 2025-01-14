/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// GameState.js
import { defaults } from '../utils/defaults.js';
import { CaLexicon } from './CaLexicon.js';
import { palettes } from '../ui/Palettes.js';
import { caPatterns } from './CaPatterns.js';
import { ICaEngine, ICaEngineState } from '../engines/BaseEngine.js';
import { EngineLife } from '../engines/EngineLife.js';
import { caEngines } from './CaEngines.js';

export class GameState implements ICaEngineState {
  isRunning: boolean;
  isGeometryDirty: boolean;
  isContentDirty: boolean;
  isCursorDirty: boolean;
  isPaletteChanged: boolean;
  speed: number;

  showGrid: boolean;
  observers: Set<Function>;
  interactMode: 'pan' | 'paint' = 'pan';
  isInitializing: boolean;
  boardResized: boolean;
  allowRedraw: boolean = true;
  paintTool: 'pencil' | 'line' | 'rectangle' | 'circle' = 'pencil';

  // CA Engine state
  isWrap: boolean; // Wrap around the edges
  cycle: number; // Current cycle
  last1DRow: number; // Track the last processed row of 1-D CA

  currentEngine: ICaEngine;
  currentFamilyCode: string;
  currentRuleDefinition: string;
  currentRuleName: string;
  currentFileName: string;
  currentFileDescription: string;

  lexicon: CaLexicon;

  constructor() {
    this.isRunning = false;
    this.isGeometryDirty = false;
    this.isContentDirty = false;
    this.isCursorDirty = false;
    this.isPaletteChanged = false;
    this.speed = defaults.game.defaultSpeed;
    this.isWrap = true;
    this.cycle = 0;
    this.last1DRow = 0;
    this.showGrid = true;
    this.observers = new Set();
    this.interactMode = 'pan';
    this.isInitializing = false;
    this.boardResized = false;

    this.currentEngine = new EngineLife();
    this.currentFamilyCode = defaults.game.defaultFamily;
    this.currentRuleDefinition = defaults.game.defaultRuleDefinition;
    this.currentRuleName = defaults.game.defaultRuleName;
    this.currentFileName = 'Untitled';
    this.currentFileDescription = '';

    this.lexicon = new CaLexicon();
  }

  async initialize() {
    this.isInitializing = true;
    await this.lexicon.loadRulesFromFile();

    // Load patterns synchronously
    const patternsResponse = await fetch('data/patterns.txt');
    const patternsText = await patternsResponse.text();
    caPatterns.getPatternsListFromText(patternsText);

    // Load must-see patterns synchronously
    const mustSeeResponse = await fetch('data/mustsee.txt');
    const mustSeeText = await mustSeeResponse.text();
    caPatterns.getMustSeePatternsFromText(mustSeeText);

    this.activateRule(this.currentFamilyCode, this.currentRuleDefinition);
    this.isInitializing = false;
  }

  subscribe(observer: Function) {
    this.observers.add(observer);
  }

  unsubscribe(observer: Function) {
    this.observers.delete(observer);
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer(this));
  }

  getNumberOfStates(): number {
    if (!this.currentEngine) {
      return 2;
    }
    return this.currentEngine.numStates;
  }

  setState(updates: Partial<GameState>) {
    Object.assign(this, updates);

    if ('boardResized' in updates || 'showGrid' in updates) {
      this.isGeometryDirty = true;
      this.isContentDirty = true;
    }

    if ('cycle' in updates || 'isPaletteChanged' in updates) {
      this.isContentDirty = true;
    }

    if ('interactMode' in updates) {
      this.isCursorDirty = true;
    }

    if (!this.isInitializing) {
      this.notifyObservers();
      this.isPaletteChanged = false;
    }
  }

  /// This is the only way to activate a rule engine.
  activateRule(familyCode: string, ruleDefinition: string) {
    // console.log(`Activating: family ${familyCode}, rule ${ruleName} (${ruleDefinition})`);

    // Get the engine for this family
    const engine = caEngines.getEngineForFamily(familyCode);
    if (!engine) {
      console.error(`No engine found for family ${familyCode}`);
      return;
    }

    // Initialize the engine with the rule definition
    engine.initFromString(ruleDefinition);

    // Lookup the official rule name in the lexicon
    const lexEntry = this.lexicon.getEntry(familyCode, ruleDefinition);
    let ruleName = 'Unknown';
    if (lexEntry) {
      ruleName = lexEntry.ruleName;
    }
    engine.ruleName = ruleName;

    // Update all palettes based on the new number of states
    palettes.updateColors(engine.numStates);

    // Update game state
    this.setState({
      currentEngine: engine,
      currentFamilyCode: familyCode,
      currentRuleDefinition: ruleDefinition,
      currentRuleName: ruleName,
      isPaletteChanged: true,
    });

    this.last1DRow = 0; // Reset the last row for 1-D CA

    // console.log(`Activated: family ${this.currentFamilyCode}, rule ${this.currentRuleName} (${this.currentRuleDefinition})`);
  }
}

export const gameState = new GameState();
