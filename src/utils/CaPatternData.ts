/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// CaPatternData.js
// Utility class for temporary storing of loaded cell data
export class LoadedCell {
  x: number = 0;
  y: number = 0;
  state: number = 0;
}

// Class representing pattern data for Cellular Automata.
// This class serves as a common data structure for different CA file formats.
export class CaPatternData {
  loadSuccess: boolean;
  family: string;
  description: string;
  fileName: string;
  loadedCells: number[][]; // x,y,state
  boardSize: { width: number; height: number };
  rules: string;
  wrap: number; // -1 not set, 0 no wrap, 1 wrap
  colors: number; // number of colors
  speed: number; // -1 not set, else delay in ms
  palette: string; // optional color palette
  diversities: string[]; // optional diversities

  constructor() {
    this.loadSuccess = false; // indicates if any cells were loaded successfully
    this.family = 'Life';
    this.description = '';
    this.fileName = 'Untitled';
    this.loadedCells = [];
    this.boardSize = { width: 0, height: 0 };
    this.rules = '';
    this.wrap = -1; // -1 not set, 0 no wrap, 1 wrap
    this.colors = 2;
    this.speed = -1; // -1 not set, else delay in ms
    this.palette = ''; // optional color palette
    this.diversities = []; // optional diversities

    this.clear();
  }

  /**
   * Clears all data
   */
  clear() {
    this.loadSuccess = false; // indicates if any cells were loaded successfully
    this.family = 'Life'; // family/engine type
    this.description = '';
    this.loadedCells = [];
    this.boardSize = { width: 0, height: 0 };
    this.rules = '';
    this.wrap = -1; // -1 not set, 0 no wrap, 1 wrap
    this.colors = 2;
    this.speed = -1; // -1 not set, else delay in ms
    this.palette = ''; // optional color palette
    this.diversities = []; // optional diversities
  }

  /**
   * Sets whether the pattern was loaded successfully
   * @param {boolean} success
   * @returns {CaPatternData}
   */
  setLoadSuccess(success: boolean) {
    this.loadSuccess = success;
    return this;
  }

  // Sets the family/engine type of the CA pattern
  setFamily(family: string): CaPatternData {
    this.family = family;
    return this;
  }

  // Sets the pattern description
  setDescription(description: string): CaPatternData {
    this.description = description;
    return this;
  }

  // Sets the loaded cell data
  setLoadedCells(cells: number[][]): CaPatternData {
    this.loadedCells = cells;
    return this;
  }

  // Sets the board size
  setBoardSize(size: { width: number; height: number }): CaPatternData {
    this.boardSize = size;
    return this;
  }

  // Sets the CA rules
  setRules(rules: string): CaPatternData {
    this.rules = rules;
    return this;
  }

  // Sets the wrap mode
  // -1: not set, 0: no wrap, 1: wrap
  setWrap(wrap: number): CaPatternData {
    this.wrap = wrap;
    return this;
  }

  // Sets the simulation speed
  // -1: not set, else delay in ms
  setSpeed(speed: number): CaPatternData {
    this.speed = speed;
    return this;
  }

  // Sets the number of colors
  setColors(colors: number): CaPatternData {
    this.colors = colors;
    return this;
  }

  // Sets the color palette
  setPalette(palette: string): CaPatternData {
    this.palette = palette;
    return this;
  }

  // Adds the diversities' config line
  addDiversity(diversities: string): CaPatternData {
    this.diversities.push(diversities);
    return this;
  }

  // Returns whether the pattern contains diversities
  hasDiversities(): boolean {
    return this.diversities.length > 0;
  }

  // Converts the loaded list of cell data to a 2D grid
  static convertLoadedCellsToGrid(cells: LoadedCell[]): number[][] {
    if (!cells.length) return [];

    // Find grid boundaries
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const cell of cells) {
      minX = Math.min(minX, cell.x);
      maxX = Math.max(maxX, cell.x);
      minY = Math.min(minY, cell.y);
      maxY = Math.max(maxY, cell.y);
    }

    // Create grid
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const grid = Array(width)
      .fill(0)
      .map(() => Array(height).fill(0));

    // Fill grid with cells
    for (const cell of cells) {
      const x = cell.x - minX;
      const y = cell.y - minY;
      grid[x][y] = cell.state;
    }

    return grid;
  }
}
