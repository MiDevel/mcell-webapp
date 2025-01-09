/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// BoardDialog.js
import { dialog, TDialog } from './Dialog.js';
import { boardState } from '../core/BoardState.js';
import { gameState } from '../core/GameState.js';
import { palettes } from '../ui/Palettes.js';
import { Constants } from '../utils/Constants.js';
import { undoSystem, UndoSystem } from '../core/UndoSystem.js';
import { settings } from '../core/Settings.js';

export class BoardDialog {
  dialog: TDialog;

  constructor() {
    this.dialog = dialog;
  }

  private quickSizes = [
    { label: 'Custom', width: 0, height: 0 },
    { label: '40 x 40', width: 40, height: 40 },
    { label: '80 x 60', width: 80, height: 60 },
    { label: '80 x 80', width: 80, height: 80 },
    { label: '120 x 80', width: 120, height: 80 },
    { label: '160 x 120', width: 160, height: 120 },
    { label: '160 x 160', width: 160, height: 160 },
    { label: '200 x 160', width: 200, height: 160 },
    { label: '200 x 200', width: 200, height: 200 },
    { label: '400 x 300', width: 400, height: 300 },
    { label: '400 x 400', width: 400, height: 400 },
    { label: '600 x 600', width: 600, height: 600 },
  ];

  createDialogContent(): string {
    // Find if current size matches any quick size
    const currentSize =
      this.quickSizes.find(
        (size) =>
          size.width === boardState.lattice.width && size.height === boardState.lattice.height
      ) || this.quickSizes[0];

    return `
            <div class="board-settings">
              <div class="settings-group-frame">
                <div class="setting-group">
                  <label for="quickSize">Quick size select:</label>
                  <select id="quickSize">
                    ${this.quickSizes
                      .map(
                        (size) => `
                        <option value="${size.width},${size.height}" 
                            ${size.label === currentSize.label ? 'selected' : ''}>
                            ${size.label}
                        </option>
                    `
                      )
                      .join('')}
                  </select>
                </div>
                <div class="setting-group">
                  <label for="boardWidth">Size (w x h):</label>
                  <input type="number" id="boardWidth" value="${boardState.lattice.width}" min="10" max="10000">
                  <label>x</label>
                  <input type="number" id="boardHeight" value="${boardState.lattice.height}" min="10" max="10000">
                </div>
              </div>

              <div class="settings-group-frame">
              <div class="setting-group">
                <label for="color-palette">Color palette:</label>
                <select id="color-palette">
                  ${palettes.list.map((palette) => `<option value="${palette.name}" ${settings.getPaletteName() === palette.name ? 'selected' : ''}>${palette.name}</option>`).join('')}
                </select>
              </div>
              <div class="setting-group">
                <label for="cellSize">Cell Size:</label>
                <input type="number" id="cellSize" value="${boardState.cellSize}" min="${Constants.MIN_CELL_SIZE}" max="${Constants.MAX_CELL_SIZE}">
              </div>
              </div>

              <div class="settings-group-frame">
              <div class="setting-group">
                <label>
                  <input type="checkbox" id="boardWrap" ${gameState.isWrap ? 'checked' : ''}>
                  Wrap at edges
                </label>
              </div>
              <div class="setting-group">
                <label>
                  <input type="checkbox" id="showGrid" ${gameState.showGrid ? 'checked' : ''}>
                  Show grid
                </label>
              </div>
              </div>
              <div class="dialog-buttons">
                <button class="primary" id="acceptBoardSize">Accept</button>
                <button id="cancelBoardSize">Cancel</button>
              </div>
            </div>
        `;
  }

  show() {
    this.dialog.show('Board Settings', this.createDialogContent());

    // Add event listener for quick size select
    const quickSizeSelect = document.getElementById('quickSize') as HTMLSelectElement;
    const widthInput = document.getElementById('boardWidth') as HTMLInputElement;
    const heightInput = document.getElementById('boardHeight') as HTMLInputElement;
    const cellSizeInput = document.getElementById('cellSize') as HTMLInputElement;

    if (!quickSizeSelect || !widthInput || !heightInput || !cellSizeInput) {
      console.error('Board Settings - DOM elements not found');
      return;
    }

    quickSizeSelect.addEventListener('change', () => {
      const [width, height] = quickSizeSelect.value.split(',').map(Number);
      if (width > 0 && height > 0) {
        widthInput.value = width.toString();
        heightInput.value = height.toString();
      }
    });

    // Add event listener for the accept button
    const acceptBtn = document.getElementById('acceptBoardSize');
    if (acceptBtn) {
      const handleAccept = () => {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        const colorPalette = document.getElementById('color-palette') as HTMLSelectElement;
        settings.setPaletteName(colorPalette.value);
        const cellSize = parseInt(cellSizeInput.value);

        const isWrap = (document.getElementById('boardWrap') as HTMLInputElement)?.checked || true;
        const showGrid = (document.getElementById('showGrid') as HTMLInputElement)?.checked || true;

        if (width >= 10 && width <= 10000 && height >= 10 && height <= 10000) {
          if (width !== boardState.lattice.width || height !== boardState.lattice.height) {
            // Add current state to Undo history
            undoSystem.addItem(UndoSystem.UNDO_EVT_SIZE);
          }

          boardState.resize(width, height);
          boardState.cellSize = cellSize;
          gameState.setState({ showGrid, isWrap, isPaletteChanged: true });
          this.dialog.close();
          // Clean up event listener
          acceptBtn.removeEventListener('click', handleAccept);
        }
      };
      acceptBtn.addEventListener('click', handleAccept);
    }

    // Add event listener for the cancel button
    const cancelBtn = document.getElementById('cancelBoardSize');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.dialog.close();
      });
    }
  }
}

export const boardDialog = new BoardDialog();
