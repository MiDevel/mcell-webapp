/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// SavePatternDialog.js
import { dialog, TDialog } from './Dialog.js';

export class SavePatternDialog {
  dialog: TDialog;
  descriptionArea: HTMLTextAreaElement | null = null;
  speedCheckbox: HTMLInputElement | null = null;
  paletteCheckbox: HTMLInputElement | null = null;
  private onAcceptCallback:
    | ((description: string, saveSpeed: boolean, savePalette: boolean) => void)
    | null = null;

  constructor() {
    this.dialog = dialog;
  }

  createDialogContent(): string {
    return `
            <div class="dialog-content">
              <div class="form-group">
                <label>Pattern description:</label>
                <textarea id="descriptionArea" class="full-width dark-mode-textarea" rows="6"></textarea>
              </div>
              <div class="form-group">
                <label>Also save:</label>
                <div class="setting-group">
                  <input type="checkbox" id="speedCheckbox">
                  <label for="speedCheckbox">current speed</label>
                </div>
                <div class="setting-group">
                  <input type="checkbox" id="paletteCheckbox">
                  <label for="paletteCheckbox">color palette name</label>
                </div>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="primary" id="acceptBtn">Accept</button>
              <button id="closeBtn">Close</button>
            </div>`;
  }

  show(
    defaultDescription: string,
    saveSpeed: boolean,
    savePalette: boolean,
    onAccept?: (description: string, saveSpeed: boolean, savePalette: boolean) => void
  ) {
    this.onAcceptCallback = onAccept || null;
    this.dialog.show('Save Pattern', this.createDialogContent());

    // Get DOM elements
    this.descriptionArea = document.getElementById('descriptionArea') as HTMLTextAreaElement;
    this.speedCheckbox = document.getElementById('speedCheckbox') as HTMLInputElement;
    this.paletteCheckbox = document.getElementById('paletteCheckbox') as HTMLInputElement;

    // Set initial values
    if (this.descriptionArea) this.descriptionArea.value = defaultDescription;
    if (this.speedCheckbox) this.speedCheckbox.checked = saveSpeed;
    if (this.paletteCheckbox) this.paletteCheckbox.checked = savePalette;

    // Set up event handlers
    document.getElementById('acceptBtn')?.addEventListener('click', () => this.onAccept());
    document.getElementById('closeBtn')?.addEventListener('click', () => this.dialog.close());
  }

  onAccept() {
    const description = this.descriptionArea?.value || '';
    const saveSpeed = this.speedCheckbox?.checked || false;
    const savePalette = this.paletteCheckbox?.checked || false;

    this.dialog.close();

    // Call the callback if it exists
    this.onAcceptCallback?.(description, saveSpeed, savePalette);
  }
}

export const savePatternDialog = new SavePatternDialog();
