/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// SelectionUtils.js - Utility functions for manipulating selection lattice
import { boardState } from '../core/BoardState.js';
import { gameState } from '../core/GameState.js';
import { Lattice } from '../core/Lattice.js';
import { Toast } from '../ui/Toast.js';

export class SelectionUtils {
  /**
   * Flips the selection horizontally
   */
  static flipHorizontal(): void {
    if (!boardState.selectionLattice) return;

    const lattice = boardState.selectionLattice;
    const newCells = new Array(lattice.width).fill(0).map(() => new Array(lattice.height).fill(0));

    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        newCells[lattice.width - 1 - x][y] = lattice.cells[x][y];
      }
    }

    lattice.cells = newCells;
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Flips the selection vertically
   */
  static flipVertical(): void {
    if (!boardState.selectionLattice) return;

    const lattice = boardState.selectionLattice;
    const newCells = new Array(lattice.width).fill(0).map(() => new Array(lattice.height).fill(0));

    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        newCells[x][lattice.height - 1 - y] = lattice.cells[x][y];
      }
    }

    lattice.cells = newCells;
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Rotates the selection 90 degrees counterclockwise
   */
  static rotateLeft(): void {
    if (!boardState.selectionLattice) return;

    const lattice = boardState.selectionLattice;
    const newWidth = lattice.height;
    const newHeight = lattice.width;
    const newCells = new Array(newWidth).fill(0).map(() => new Array(newHeight).fill(0));

    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        newCells[lattice.height - 1 - y][x] = lattice.cells[x][y];
      }
    }

    lattice.width = newWidth;
    lattice.height = newHeight;
    lattice.cells = newCells;
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Rotates the selection 90 degrees clockwise
   */
  static rotateRight(): void {
    if (!boardState.selectionLattice) return;

    const lattice = boardState.selectionLattice;
    const newWidth = lattice.height;
    const newHeight = lattice.width;
    const newCells = new Array(newWidth).fill(0).map(() => new Array(newHeight).fill(0));

    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        newCells[y][lattice.width - 1 - x] = lattice.cells[x][y];
      }
    }

    lattice.width = newWidth;
    lattice.height = newHeight;
    lattice.cells = newCells;
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Inverts the states of all cells in the selection
   */
  static invert(): void {
    if (!boardState.selectionLattice) return;

    const lattice = boardState.selectionLattice;
    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        const state = lattice.cells[x][y];
        lattice.cells[x][y] = state === 0 ? 1 : 0;
      }
    }

    gameState.setState({ isContentDirty: true });
  }

  /**
   * Clears the current selection without applying it to the main lattice
   */
  static eraseSelection(): void {
    if (!boardState.selectionLattice) return;

    boardState.selectionActive = false;
    boardState.selectionLattice = null;
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Copies the current selection to clipboard
   */
  static copy(): void {
    if (!boardState.selectionLattice) return;

    // Create a new lattice with the same dimensions
    const lattice = boardState.selectionLattice;
    boardState.clipboardLattice = new Lattice(lattice.width, lattice.height);

    // Copy all cells
    for (let x = 0; x < lattice.width; x++) {
      for (let y = 0; y < lattice.height; y++) {
        boardState.clipboardLattice.cells[x][y] = lattice.cells[x][y];
      }
    }

    // Show toast notification
    Toast.show('Selection copied to clipboard');

    // Trigger state update to enable paste button
    gameState.setState({ isContentDirty: true });
  }

  /**
   * Creates a new selection from clipboard content and centers it in the visible area
   */
  static paste(): void {
    if (!boardState.clipboardLattice) return;

    // If there's an active selection, apply it first
    if (boardState.selectionActive && boardState.selectionLattice) {
      boardState.applySelection();
    }

    // Create a new selection from clipboard
    const clip = boardState.clipboardLattice;
    boardState.selectionLattice = new Lattice(clip.width, clip.height);

    // Copy all cells
    for (let x = 0; x < clip.width; x++) {
      for (let y = 0; y < clip.height; y++) {
        boardState.selectionLattice.cells[x][y] = clip.cells[x][y];
      }
    }

    // Get the visible area center from Board.ts
    const board = document.querySelector('canvas');
    if (!board) return;

    const visibleWidth = board.width / boardState.cellSize;
    const visibleHeight = board.height / boardState.cellSize;

    // Center the selection in the visible area
    const centerX = Math.floor((visibleWidth - clip.width) / 2);
    const centerY = Math.floor((visibleHeight - clip.height) / 2);

    boardState.selectionLattice.left = centerX;
    boardState.selectionLattice.top = centerY;
    boardState.selectionActive = true;

    gameState.setState({ isContentDirty: true });
  }

  /**
   * Moves the selection by the specified offset, ensuring it stays within lattice bounds.
   * Returns true if any movement was possible, false if completely blocked.
   */
  static moveSelection(dx: number, dy: number): boolean {
    if (!boardState.selectionLattice) return false;

    const lattice = boardState.selectionLattice;
    let newLeft = lattice.left + dx;
    let newTop = lattice.top + dy;

    // Clamp to lattice bounds
    newLeft = Math.max(0, Math.min(newLeft, boardState.lattice.width - lattice.width));
    newTop = Math.max(0, Math.min(newTop, boardState.lattice.height - lattice.height));

    // Check if any movement occurred
    const moved = newLeft !== lattice.left || newTop !== lattice.top;
    if (moved) {
      lattice.left = newLeft;
      lattice.top = newTop;
      gameState.setState({ isContentDirty: true });
    }

    return moved;
  }

  /**
   * Returns true if there is an active selection
   */
  static hasSelection(): boolean {
    return boardState.selectionActive && boardState.selectionLattice !== null;
  }
}
