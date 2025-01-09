/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Life103Parser.js - Handles parsing of Life 1.03 pattern files
import { CaPatternData, LoadedCell } from '../utils/CaPatternData.js';

export class Life103Parser {
  static parseLife103(content: string, patternData: CaPatternData): boolean {
    const lines = content.split('\n');

    let description: string[] = [];
    let cells: LoadedCell[] = [];
    let loadSuccess = false;

    // Many life patterns do not contain any headers
    patternData.setRules('23/3');

    // Process each line
    for (const line of lines) {
      if (this.processLife103Line(line, cells, description, patternData)) {
        loadSuccess = true;
      }
    }

    if (loadSuccess) {
      const grid = CaPatternData.convertLoadedCellsToGrid(cells);
      patternData.setLoadedCells(grid);
    } else {
      patternData.setLoadedCells([]);
    }

    patternData.setDescription(description.join('\n')).setLoadSuccess(loadSuccess);

    return loadSuccess;
  }

  static processLife103Line(
    line: string,
    cells: LoadedCell[],
    description: string[],
    patternData: CaPatternData
  ) {
    let success = false;
    line = line.trim();

    if (!line) return success;

    // Handle special characters
    if (['#', '!', '/'].includes(line[0])) {
      if (line.startsWith('#N')) {
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

    // Process cell coordinates
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const x = parseInt(parts[0]);
      const y = parseInt(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        cells.push({ x, y, state: 1 });
        success = true;
      }
    }

    return success;
  }

  // static convertCellsToGrid(cells: number[][]): number[][] {
  //     if (!cells.length) return [];

  //     // Find the bounds
  //     let minX = Infinity, maxX = -Infinity;
  //     let minY = Infinity, maxY = -Infinity;

  //     for (const [x, y] of cells) {
  //         minX = Math.min(minX, x);
  //         maxX = Math.max(maxX, x);
  //         minY = Math.min(minY, y);
  //         maxY = Math.max(maxY, y);
  //     }

  //     // Create the grid
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
