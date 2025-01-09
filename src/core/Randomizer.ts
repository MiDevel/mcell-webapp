/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Randomizer.js
import { Lattice } from './Lattice';
import { undoSystem, UndoSystem } from './UndoSystem.js';

export class RamdomizerSettings {
  monoState: boolean = true;
  state: number = 1;
  density: number = 20;
  clearBoard: boolean = true;

  setDefaults() {
    this.monoState = true;
    this.state = 1;
    this.density = 20;
    this.clearBoard = true;
  }

  setSettings(settings: RamdomizerSettings) {
    this.monoState = settings.monoState;
    this.state = settings.state;
    this.density = settings.density;
    this.clearBoard = settings.clearBoard;
  }
}

export class Randomizer {
  settings: RamdomizerSettings = new RamdomizerSettings();

  setSettings(settings: RamdomizerSettings) {
    this.settings.setSettings(settings);
  }

  randomize(lattice: Lattice, statesCount: number, settings = null) {
    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_RAND);

    if (settings) {
      this.settings.setSettings(settings);
    }

    const { monoState, state, density, clearBoard } = this.settings;

    if (clearBoard) {
      lattice.clear();
    }

    const threshold = density / 100;
    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        if (Math.random() < threshold) {
          if (monoState) {
            lattice.setCell(x, y, state);
          } else {
            // Generate random state between 1 and statesCount
            let random_state = Math.floor(Math.random() * (statesCount - 1)) + 1;
            lattice.setCell(x, y, random_state);
          }
        }
      }
    }
  }
}

export const randomizer = new Randomizer();
