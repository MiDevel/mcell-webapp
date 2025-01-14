/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Lattice.js - Handles lattice of cells in a CA
export class Lattice {
  width: number;
  height: number;
  cells: number[][]; // 2D array of cells, cells[col][row]
  left: number = 0;
  top: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width).fill(0).map(() => new Array(height).fill(0));
  }

  getCell(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 0;
    }
    return this.cells[x][y];
  }

  setCell(x: number, y: number, state: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    this.cells[x][y] = state;
    return true;
  }

  clear(): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.cells[x][y] = 0;
      }
    }
  }

  resize(newWidth: number, newHeight: number): void {
    const newCells = new Array(newWidth).fill(0).map(() => new Array(newHeight).fill(0));
    for (let x = 0; x < Math.min(this.width, newWidth); x++) {
      for (let y = 0; y < Math.min(this.height, newHeight); y++) {
        newCells[x][y] = this.cells[x][y] || 0;
      }
    }
    this.width = newWidth;
    this.height = newHeight;
    this.cells = newCells;
  }

  // Calculates the bounding rectangle of the alive cells.
  // Returns { minY, maxY, minX, maxX }
  // When there are no alive cells, maxX and maxY are set to -1
  getBoundingRect(): { minY: number; maxY: number; minX: number; maxX: number } {
    let minX = this.width;
    let maxX = -1;
    let minY = this.height;
    let maxY = -1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getCell(x, y) > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    // console.log(`(${minX}, ${minY})-(${maxX}, ${maxY})  ${maxX - minX + 1}x${maxY - minY + 1}`);
    return { minY, maxY, minX, maxX };
  }
}
