/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// RandomizeDialog.js
import { dialog } from './Dialog.js';
import { randomizer, RamdomizerSettings } from '../core/Randomizer.js';

export class RandomizeDialog {
  dialog: typeof dialog;

  stateInputs: NodeListOf<HTMLInputElement> | null = null;
  stateInput: HTMLInputElement | null = null;
  densityInput: HTMLInputElement | null = null;
  clearBoardInput: HTMLInputElement | null = null;

  constructor() {
    this.dialog = dialog;
  }

  createDialogContent(): string {
    return `
            <div class="dialog-content">
                <div class="form-group">
                    <div class="radio-group">
                        <label class="radio-with-input">
                            <input type="radio" name="stateMode" value="mono" checked> 
                            Single state
                            <input type="number" id="state" min="1" value="1" class="inline-input">
                        </label>
                    </div>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="stateMode" value="multi"> 
                            Multiple states
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="label-with-input">
                        Density (%):
                        <input type="number" id="density" min="0" max="100" step="5" value="10" class="inline-input">
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="clearBoard" checked> 
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
    this.dialog.show('Randomize Settings', content);

    // Get form elements after dialog is shown
    const dialogEl = this.dialog.activeDialog;
    if (!dialogEl) {
      throw new Error('Dialog element not found.');
    }

    this.stateInputs = dialogEl.querySelectorAll('input[name="stateMode"]');
    this.stateInput = dialogEl.querySelector('#state');
    this.densityInput = dialogEl.querySelector('#density');
    this.clearBoardInput = dialogEl.querySelector('#clearBoard');

    // Update form with current settings
    const { monoState, state, density, clearBoard } = randomizer.settings;
    this.stateInputs![monoState ? 0 : 1].checked = true;
    this.stateInput!.value = state.toString();
    this.stateInput!.disabled = !monoState;
    this.densityInput!.value = density.toString();
    this.clearBoardInput!.checked = clearBoard;

    // Add event listeners
    this.stateInputs.forEach((input) => {
      input!.addEventListener('change', () => {
        this.stateInput!.disabled = input!.value === 'multi';
      });
    });

    // Add button event listeners
    const acceptBtn = dialogEl.querySelector('#acceptBtn');
    const cancelBtn = dialogEl.querySelector('#cancelBtn');

    acceptBtn!.addEventListener('click', () => this.acceptSettings());
    cancelBtn!.addEventListener('click', () => this.dialog.close());
  }

  acceptSettings() {
    const settings = new RamdomizerSettings();
    settings.monoState = this.stateInputs![0].checked;
    settings.state = parseInt(this.stateInput!.value);
    settings.density = parseFloat(this.densityInput!.value);
    settings.clearBoard = this.clearBoardInput!.checked;

    // Validate state value
    if (settings.monoState && settings.state < 1) {
      settings.state = 1;
    }

    // Validate density
    if (settings.density < 0) settings.density = 0;
    if (settings.density > 100) settings.density = 100;

    randomizer.setSettings(settings);
    this.dialog.close();
  }
}

export const randomizeDialog = new RandomizeDialog();
