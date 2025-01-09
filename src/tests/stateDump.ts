/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// stateDump.js
// Functions for dumping state information for debugging purposes
import { board } from '../ui/Board.js';
import { boardState } from '../core/BoardState.js';
import { gameState } from '../core/GameState.js';
import { palettes, Palette } from '../ui/Palettes.js';
import { Diversities, diversities } from '../core/Diversities.js';
import { Lattice } from '../core/Lattice.js';
import MclBuilder from '../utils/MclBuilder.js';
import { settings } from '../core/Settings.js';

class Histogram {
  states: number[] = [];
  alive: number = 0;
  firing: number = 0;
  total: number = 0;

  constructor(numStates: number) {
    this.states = Array(numStates).fill(0);
  }

  add(state: number) {
    this.states[state] = (this.states[state] || 0) + 1;
    this.alive += state > 0 ? 1 : 0;
    this.firing += state === 1 ? 1 : 0;
    this.total++;
  }
}

function buildHistogram(lattice: Lattice, numStates: number): Histogram {
  const histogram: Histogram = new Histogram(numStates);
  for (let col = 0; col < lattice.width; col++) {
    for (let row = 0; row < lattice.height; row++) {
      const state = lattice.getCell(col, row);
      histogram.add(state);
    }
  }
  histogram.total = lattice.width * lattice.height;
  return histogram;
}

export function dumpStateInfo() {
  console.group('MCell State Dump');

  // Board State information
  console.group('Board State');
  console.log(
    `Grid Size: ${boardState.lattice.width} x ${boardState.lattice.height}}, wrap: ${gameState.isWrap}`
  );
  console.log('Cell Size:', boardState.cellSize);
  console.log('Histogram:', buildHistogram(boardState.lattice, gameState.getNumberOfStates()));
  console.log('Board draws:', board.numBoardDraws);
  console.groupEnd();

  // Game State information
  console.group('Game State');
  console.log('Interact mode:', gameState.interactMode);
  const run = {
    'Is Running': gameState.isRunning,
    Speed: gameState.speed,
    'Cycle Count': gameState.cycle,
  };
  console.log('Run:', run);

  // CA engine
  const ca = {
    Family: gameState.currentFamilyCode,
    Definition: gameState.currentRuleDefinition,
    Name: gameState.currentRuleName,
    States: gameState.getNumberOfStates(),
    Palette: settings.getPaletteName(),
  };
  console.log('CA:', ca);

  // Cells' color palette
  const currentPalette: Palette = palettes.getPalette(settings.getPaletteName());
  const palette = {
    Name: currentPalette.name,
    Size: currentPalette.colors.length,
    Colors: currentPalette.colors,
    'Grid Line Colors': currentPalette.gridLineColors,
  };
  console.log('Palette:', palette);
  console.groupEnd();

  // Diversities
  if (diversities.isEnabled()) {
    console.group('Diversities');
    console.log(diversities.itemAsString(Diversities.DIV_SYSTEM));
    console.log(diversities.itemAsString(Diversities.DIV_NOISE));
    console.log(diversities.itemAsString(Diversities.DIV_BHOLE));
    console.log(diversities.itemAsString(Diversities.DIV_SNOVA));
    console.log(diversities.itemAsString(Diversities.DIV_STRIN));
    console.groupEnd();
  }

  console.groupEnd();
}

export function dumpPattern() {
  console.log('Dumping pattern...');

  const { pattern, numAlive }: { pattern: string; numAlive: number } = MclBuilder.build(
    boardState.lattice
  );

  // split text into lines of max 70 characters each
  const lines: string[] = [];
  for (let i = 0; i < pattern.length; i += 70) {
    lines.push(pattern.substring(i, i + 70));
  }

  console.log(`Alive cells: ${numAlive}`);
  for (let line of lines) {
    console.log('#L ' + line);
  }
}
