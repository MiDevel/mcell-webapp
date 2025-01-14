/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// BoardState.js
import { Lattice } from './Lattice.js';
import { gameState, GameState } from './GameState.js';
import { defaults } from '../utils/defaults.js';
import { randomizer } from './Randomizer.js';
import { seeder } from './Seeder.js';
import { undoSystem, UndoSystem } from './UndoSystem.js';

export class BoardState {
  lattice: Lattice;
  cellSize: number;
  selectionActive: boolean;
  selectionLattice: Lattice | null;
  clipboardLattice: Lattice | null;
  dynaDrawActive: boolean;
  dynaDrawLattice: Lattice | null;

  constructor() {
    this.lattice = new Lattice(defaults.board.defaultCols, defaults.board.defaultRows);
    this.cellSize = defaults.board.defaultCellSize;
    this.selectionActive = false;
    this.selectionLattice = null;
    this.clipboardLattice = null;
    this.dynaDrawActive = false;
    this.dynaDrawLattice = null;
  }

  resize(newCols: number, newRows: number) {
    this.lattice.resize(newCols, newRows);
    gameState.setState({ boardResized: true });
  }

  clear() {
    this.lattice.clear();
    gameState.currentFileName = '';
    gameState.setState({ cycle: 0 });
  }

  applySelection() {
    if (this.selectionLattice) {
      // Move cells from selection back to main lattice at current position
      for (let x = 0; x < this.selectionLattice.width; x++) {
        for (let y = 0; y < this.selectionLattice.height; y++) {
          const state = this.selectionLattice.getCell(x, y);
          if (state > 0) {
            const boardX = x + this.selectionLattice.left;
            const boardY = y + this.selectionLattice.top;
            this.lattice.setCell(boardX, boardY, state);
          }
        }
      }
    }
    this.discardSelection();

    gameState.setState({ isContentDirty: true });
  }

  createSelection(left: number, top: number, width: number, height: number) {
    // Add current state to undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_EDIT);

    this.selectionLattice = new Lattice(width, height);
    this.selectionLattice.left = left;
    this.selectionLattice.top = top;

    // Move cells from main lattice to selection
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const boardX = x + left;
        const boardY = y + top;
        const state = this.lattice.getCell(boardX, boardY);
        if (state > 0) {
          this.selectionLattice.setCell(x, y, state);
          this.lattice.setCell(boardX, boardY, 0);
        }
      }
    }

    this.selectionActive = true;
    gameState.setState({ isContentDirty: true });
  }

  discardSelection() {
    this.selectionActive = false;
    this.selectionLattice = null;
  }

  moveSelection(newLeft: number, newTop: number) {
    if (this.selectionLattice) {
      this.selectionLattice.left = newLeft;
      this.selectionLattice.top = newTop;
      gameState.setState({ isContentDirty: true });
    }
  }

  randomize(settings = null) {
    const statesCount = gameState.getNumberOfStates();
    randomizer.randomize(this.lattice, statesCount, settings);
    const st: Partial<GameState> = { isContentDirty: true };
    if (randomizer.settings && randomizer.settings.clearBoard) {
      st.cycle = 0;
    }
    gameState.setState(st);
  }

  seed(settings = null) {
    seeder.seed(this.lattice, settings);
    let st: Partial<GameState> = { isContentDirty: true };
    if (seeder.settings && seeder.settings.clearBoard) {
      st.cycle = 0;
    }
    gameState.setState(st);
  }
}

export const boardState = new BoardState();
