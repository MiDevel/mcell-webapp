/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Life105Parser.js - Handles parsing of Life 1.05 pattern files
import { CaPatternData, LoadedCell } from '../utils/CaPatternData.js';

export class Life105Parser {
  static parseLife105(content: string, patternData: CaPatternData): boolean {
    const lines = content.split('\n');

    const state = {
      blockX: 0,
      blockY: 0,
      row105: 0,
    };
    let description: string[] = [];
    let cells: LoadedCell[] = [];
    let loadSuccess = false;

    // Many life patterns do not contain any headers
    patternData.setRules('23/3');

    // Process each line
    for (const line of lines) {
      if (this.processLife105Line(line, state, cells, description, patternData)) {
        loadSuccess = true;
      }
    }

    // Convert cells array to 2D grid format
    if (loadSuccess) {
      const grid = CaPatternData.convertLoadedCellsToGrid(cells);
      patternData.setLoadedCells(grid);
    } else {
      patternData.setLoadedCells([]);
    }

    patternData.setDescription(description.join('\n')).setLoadSuccess(loadSuccess);

    return loadSuccess;
  }

  static processLife105Line(
    line: string,
    state: any,
    cells: LoadedCell[],
    description: string[],
    patternData: CaPatternData
  ) {
    let success = false;
    line = line.trim();

    if (!line) return success;

    // Handle special characters
    if (['#', '!', '/'].includes(line[0])) {
      if (line.startsWith('#P')) {
        // Block position
        const [_, x, y] = line.match(/#P\s*(-?\d+)?\s*(-?\d+)?/) || [null, '0', '0'];
        state.blockX = parseInt(x || '0');
        state.blockY = parseInt(y || '0');
        state.row105 = 0;
      } else if (line.startsWith('#N')) {
        // Standard rules
        patternData.setRules('23/3');
      } else if (line.startsWith('#R')) {
        // Specific rules
        const [_, rules] = line.match(/#R\s*(\S+)/) || [null, ''];
        if (rules) patternData.setRules(rules);
      } else if (line.startsWith('#S')) {
        // Speed
        const [_, speed] = line.match(/#S\s*(\d+)/) || [null, ''];
        if (speed) patternData.setSpeed(parseInt(speed));
      } else if (line.startsWith('#D') || line.startsWith('#C') || line.startsWith('!')) {
        // Description
        let desc = line.substring(line.startsWith('!') ? 1 : 2).trim();
        description.push(desc);
      }
      return success;
    }

    // Process cell data line
    let col = 0;
    let num = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char >= '0' && char <= '9') {
        num = num * 10 + parseInt(char);
      } else {
        if (num === 0) num = 1;

        // Check for alive cell
        if (['*', 'o', 'O'].includes(char)) {
          for (let j = 0; j < num; j++) {
            cells.push({ x: col + j + state.blockX, y: state.row105 + state.blockY, state: 1 });
          }
          success = true;
          col += num;
        } else {
          // blank
          col += num;
        }
        num = 0;
      }
    }

    state.row105++;
    return success;
  }

  // static convertCellsToGrid(cells: number[][]) {
  //     if (!cells.length) return [];

  //     // Find the bounds of the pattern
  //     let minX = Infinity, maxX = -Infinity;
  //     let minY = Infinity, maxY = -Infinity;

  //     for (const [x, y] of cells) {
  //         minX = Math.min(minX, x);
  //         maxX = Math.max(maxX, x);
  //         minY = Math.min(minY, y);
  //         maxY = Math.max(maxY, y);
  //     }

  //     // Create the grid with proper dimensions
  //     const width = maxX - minX + 1;
  //     const height = maxY - minY + 1;
  //     const grid = Array(height).fill(0).map(() => Array(width).fill(0));

  //     // Fill in the cells
  //     for (const [x, y, state] of cells) {
  //         grid[y - minY][x - minX] = state;
  //     }

  //     return grid;
  // }
}
