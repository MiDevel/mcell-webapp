/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// MclLoader.js - Utility for loading MCL pattern strings into the board
import { Lattice } from '../core/Lattice.js';

export class MclLoader {
  /**
   * Loads a pattern in MCL format into the lattice
   * @param lattice The target lattice
   * @param pattern The MCL pattern string
   * @param offsetX X position to start loading the pattern
   * @param offsetY Y position to start loading the pattern
   * @returns Number of alive cells loaded
   */
  public static load(
    lattice: Lattice,
    pattern: string,
    offsetX: number = 0,
    offsetY: number = 0
  ): number {
    let x = offsetX;
    let y = offsetY;
    let count = 0;
    let stateAdd = 0;
    let numAlive = 0;

    pattern = pattern.trim();
    if (!pattern) return 0;

    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];

      if (char >= '0' && char <= '9') {
        count = count * 10 + (char.charCodeAt(0) - '0'.charCodeAt(0));
      } else if (char === '.') {
        if (count === 0) count = 1;
        x += count;
        count = 0;
      } else if (char >= 'a' && char <= 'j') {
        // Handle extended states (a-j add multiples of 24 to the state)
        stateAdd = (char.charCodeAt(0) - 'a'.charCodeAt(0) + 1) * 24;
      } else if (char >= 'A' && char <= 'X') {
        if (count === 0) count = 1;
        const state = char.charCodeAt(0) - 'A'.charCodeAt(0) + 1 + stateAdd;

        // Add cells with the current state
        for (let j = 0; j < count; j++) {
          lattice.setCell(x + j, y, state);
          numAlive++;
        }

        x += count;
        stateAdd = 0;
        count = 0;
      } else if (char === '$') {
        // End of row
        if (count === 0) count = 1;
        y += count;
        x = offsetX;
        count = 0;
      }
    }

    return numAlive;
  }
}
