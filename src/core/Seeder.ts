/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Seeder.js
import { Lattice } from './Lattice';
import { undoSystem, UndoSystem } from './UndoSystem.js';

export class SeederSettings {
  shape = 'circle';
  width = 20;
  height = 14;
  radius = 15;
  filled = true;
  density = 100;
  clearBoard = true;

  setDefaults() {
    this.shape = 'circle';
    this.width = 20;
    this.height = 14;
    this.radius = 15;
    this.filled = true;
    this.density = 100;
    this.clearBoard = true;
  }

  setSettings(settings: SeederSettings) {
    this.shape = settings.shape;
    this.width = settings.width;
    this.height = settings.height;
    this.radius = settings.radius;
    this.filled = settings.filled;
    this.density = settings.density;
    this.clearBoard = settings.clearBoard;
  }

  validate() {
    if (this.width < 1) this.width = 1;
    if (this.height < 1) this.height = 1;
    if (this.radius < 1) this.radius = 1;
    if (this.density < 0) this.density = 0;
    if (this.density > 100) this.density = 100;
  }
}

export class Seeder {
  settings: SeederSettings = new SeederSettings();

  setSettings(settings: SeederSettings) {
    // Convert shape name if it includes 'filled'
    if (settings.shape) {
      if (settings.filled) {
        settings.shape = settings.shape.replace('filled', '').toLowerCase();
      }
      // Keep horizontalLine and verticalLine as is
      if (!settings.shape.includes('Line')) {
        settings.shape = settings.shape.toLowerCase();
      }
    }

    this.settings.setSettings(settings);
  }

  getDialogShape() {
    // Convert internal shape name to dialog shape name
    const { shape, filled } = this.settings;
    if (filled) {
      return 'filled' + shape.charAt(0).toUpperCase() + shape.slice(1);
    }
    // Return shape name as is for lines, otherwise ensure proper case
    return shape.includes('Line') ? shape : shape.toLowerCase();
  }

  seed(lattice: Lattice, settings: SeederSettings | null = null) {
    if (settings) {
      this.settings.setSettings(settings);
    }

    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_SEED);

    const { shape, width, height, radius, filled, density, clearBoard } = this.settings;

    if (clearBoard) {
      lattice.clear();
    }

    // Calculate center position
    const centerX = Math.floor(lattice.width / 2);
    const centerY = Math.floor(lattice.height / 2);

    // Calculate start position (top-left corner for shapes)
    const startX = Math.floor(centerX - width / 2);
    const startY = Math.floor(centerY - height / 2);

    switch (shape) {
      case 'rectangle':
        this.drawRectangle(lattice, startX, startY, width, height, filled, density);
        break;
      case 'circle':
        this.drawCircle(lattice, centerX, centerY, radius, filled, density);
        break;
      case 'horizontalLine':
        this.drawLine(lattice, centerX - Math.floor(width / 2), centerY, width, true);
        break;
      case 'verticalLine':
        this.drawLine(lattice, centerX, centerY - Math.floor(height / 2), height, false);
        break;
    }
  }

  drawRectangle(
    lattice: Lattice,
    x: number,
    y: number,
    width: number,
    height: number,
    filled: boolean,
    density: number
  ) {
    // Draw border
    for (let i = 0; i < width; i++) {
      lattice.setCell(x + i, y, 1); // Top
      lattice.setCell(x + i, y + height - 1, 1); // Bottom
    }
    for (let i = 0; i < height; i++) {
      lattice.setCell(x, y + i, 1); // Left
      lattice.setCell(x + width - 1, y + i, 1); // Right
    }

    // Fill if needed
    if (filled) {
      for (let i = 1; i < width - 1; i++) {
        for (let j = 1; j < height - 1; j++) {
          if (Math.random() * 100 < density) {
            lattice.setCell(x + i, y + j, 1);
          }
        }
      }
    }
  }

  drawCircle(
    lattice: Lattice,
    centerX: number,
    centerY: number,
    radius: number,
    filled: boolean,
    density: number
  ) {
    // Draw border
    for (let angle = 0; angle < 360; angle++) {
      const radian = (angle * Math.PI) / 180;
      const x = Math.round(centerX + radius * Math.cos(radian));
      const y = Math.round(centerY + radius * Math.sin(radian));
      lattice.setCell(x, y, 1);
    }

    // Fill if needed
    if (filled) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
          const dx = x - centerX;
          const dy = y - centerY;
          if (dx * dx + dy * dy <= radius * radius) {
            if (Math.random() * 100 < density) {
              lattice.setCell(x, y, 1);
            }
          }
        }
      }
    }
  }

  drawLine(lattice: Lattice, startX: number, startY: number, length: number, horizontal: boolean) {
    for (let i = 0; i < length; i++) {
      if (horizontal) {
        lattice.setCell(startX + i, startY, 1);
      } else {
        lattice.setCell(startX, startY + i, 1);
      }
    }
  }
}

export const seeder = new Seeder();
