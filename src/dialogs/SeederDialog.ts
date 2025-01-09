/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// SeederDialog.js
import { dialog } from './Dialog.js';
import { seeder, SeederSettings } from '../core/Seeder.js';

export class SeederDialog {
  dialog: typeof dialog;

  shapeSelect: HTMLSelectElement | null = null;
  widthInput: HTMLInputElement | null = null;
  heightInput: HTMLInputElement | null = null;
  radiusInput: HTMLInputElement | null = null;
  densityInput: HTMLInputElement | null = null;
  clearBoardInput: HTMLInputElement | null = null;
  fillGroup: HTMLElement | null = null;
  dimensionsGroup: HTMLElement | null = null;

  constructor() {
    // Initialize dialog reference
    this.dialog = dialog;
  }

  createDialogContent(): string {
    // Get current settings
    const settings = seeder.settings;
    const dialogShape = seeder.getDialogShape();

    return `
            <div class="dialog-content">
                <div class="form-group">
                    <label class="label-with-input">
                        Shape:
                        <select id="shape" class="inline-select">
                            <option value="rectangle" ${dialogShape === 'rectangle' ? 'selected' : ''}>Rectangle</option>
                            <option value="filledRectangle" ${dialogShape === 'filledRectangle' ? 'selected' : ''}>Filled Rectangle</option>
                            <option value="circle" ${dialogShape === 'circle' ? 'selected' : ''}>Circle</option>
                            <option value="filledCircle" ${dialogShape === 'filledCircle' ? 'selected' : ''}>Filled Circle</option>
                            <option value="horizontalLine" ${dialogShape === 'horizontalLine' ? 'selected' : ''}>Horizontal Line</option>
                            <option value="verticalLine" ${dialogShape === 'verticalLine' ? 'selected' : ''}>Vertical Line</option>
                        </select>
                    </label>
                </div>
                <div id="dimensionsGroup">
                    <div class="form-group dimensions rectangle-dims">
                        <label class="label-with-input">
                            Width:
                            <input type="number" id="width" min="1" value="${Math.max(1, settings.width)}" class="inline-input">
                        </label>
                    </div>
                    <div class="form-group dimensions rectangle-dims">
                        <label class="label-with-input">
                            Height:
                            <input type="number" id="height" min="1" value="${Math.max(1, settings.height)}" class="inline-input">
                        </label>
                    </div>
                    <div class="form-group dimensions circle-dims">
                        <label class="label-with-input">
                            Radius:
                            <input type="number" id="radius" min="1" value="${Math.max(1, settings.radius)}" class="inline-input">
                        </label>
                    </div>
                </div>
                <div id="fillGroup" class="form-group">
                    <div class="form-group">
                        <label class="label-with-input">
                            Fill Density (%):
                            <input type="number" id="density" min="0" max="100" step="5" value="${Math.min(100, Math.max(0, settings.density))}" class="inline-input">
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="clearBoard" ${settings.clearBoard ? 'checked' : ''}> 
                        Clear board first
                    </label>
                </div>
                <div class="dialog-buttons">
                    <button class="primary" id="acceptBtn">Accept</button>
                    <button id="cancelBtn">Cancel</button>
                </div>
            </div>`;
  }

  show() {
    const content = this.createDialogContent();
    this.dialog.show('Seed Shape', content);

    // Get form elements after dialog is shown
    const dialogEl = this.dialog.activeDialog;
    if (!dialogEl) {
      throw new Error('Dialog element not found.');
    }

    this.shapeSelect = dialogEl.querySelector('#shape');
    this.widthInput = dialogEl.querySelector('#width');
    this.heightInput = dialogEl.querySelector('#height');
    this.radiusInput = dialogEl.querySelector('#radius');
    this.densityInput = dialogEl.querySelector('#density');
    this.clearBoardInput = dialogEl.querySelector('#clearBoard');
    this.fillGroup = dialogEl.querySelector('#fillGroup');
    this.dimensionsGroup = dialogEl.querySelector('#dimensionsGroup');

    // Update visible dimensions based on shape
    this.updateVisibleDimensions();

    // Add event listeners
    this.shapeSelect!.addEventListener('change', () => {
      this.updateVisibleDimensions();
    });

    // Add button event listeners
    const acceptBtn = dialogEl.querySelector('#acceptBtn');
    const cancelBtn = dialogEl.querySelector('#cancelBtn');

    acceptBtn!.addEventListener('click', () => this.acceptSettings());
    cancelBtn!.addEventListener('click', () => this.dialog.close());
  }

  updateVisibleDimensions() {
    const shape = this.shapeSelect!.value;

    // Get all dimension groups
    const rectangleDims: NodeListOf<HTMLElement> =
      this.dimensionsGroup!.querySelectorAll('.rectangle-dims');
    const circleDims: HTMLElement | null = this.dimensionsGroup!.querySelector('.circle-dims');

    // First hide everything
    rectangleDims.forEach((el: HTMLElement) => {
      el.style.display = 'none';
    });
    if (circleDims) {
      circleDims.style.display = 'none';
    }
    this.fillGroup!.style.display = 'none';

    // Then show the appropriate elements
    switch (shape) {
      case 'rectangle':
      case 'filledRectangle':
        rectangleDims.forEach((el) => {
          el.style.display = 'block';
        });
        if (shape === 'filledRectangle') {
          this.fillGroup!.style.display = 'block';
        }
        break;
      case 'circle':
      case 'filledCircle':
        if (circleDims) {
          circleDims.style.display = 'block';
        }
        if (shape === 'filledCircle') {
          this.fillGroup!.style.display = 'block';
        }
        break;
      case 'horizontalLine':
        rectangleDims[0]!.style.display = 'block'; // Width
        break;
      case 'verticalLine':
        rectangleDims[1]!.style.display = 'block'; // Height
        break;
    }
  }

  acceptSettings() {
    const shape = this.shapeSelect!.value;

    let settings: SeederSettings = new SeederSettings();
    settings.shape = shape; // Keep the shape name as is
    settings.width = parseInt(this.widthInput!.value);
    settings.height = parseInt(this.heightInput!.value);
    settings.radius = parseInt(this.radiusInput!.value);
    settings.filled = shape.includes('filled');
    settings.density = parseFloat(this.densityInput!.value);
    settings.clearBoard = this.clearBoardInput!.checked;

    settings.validate();

    seeder.setSettings(settings);

    this.dialog.close();
  }
}

export const seederDialog = new SeederDialog();
