/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// SettingsDialog.js - Settings dialog UI
import { dialog } from './Dialog.js';
import { settings } from '../core/Settings.js';
import { UndoSystem } from '../core/UndoSystem.js';
import { palettes } from '../ui/Palettes.js';
import { Constants } from '../utils/Constants.js';
import { gameState } from '../core/GameState.js';

export class SettingsDialog {
  private dialog: typeof dialog;

  constructor() {
    this.dialog = dialog;
  }

  show() {
    const content = [];

    // UI Settings section
    content.push('<div class="settings-section">');
    content.push('<h3>UI Settings</h3>');
    content.push('<div class="settings-group">');
    content.push('<label>Theme:</label>');
    content.push('<select id="setting-theme">');
    content.push(
      `<option value="dark" ${settings.getTheme() === 'dark' ? 'selected' : ''}>Dark</option>`
    );
    content.push(
      `<option value="light" ${settings.getTheme() === 'light' ? 'selected' : ''}>Light</option>`
    );
    content.push('</select>');
    content.push('</div>');
    content.push('</div>');

    // General Settings section
    content.push('<div class="settings-section">');
    content.push('<h3>General Settings</h3>');
    content.push('<div class="settings-group">');
    content.push('<label>Palette:</label>');
    content.push('<select id="setting-palette">');

    // Add all available palettes
    palettes.list.forEach((palette) => {
      content.push(
        `<option value="${palette.name}" ${settings.getPaletteName() === palette.name ? 'selected' : ''}>${palette.name}</option>`
      );
    });

    content.push('</select>');
    content.push('</div>');
    content.push('</div>');

    // Undo Settings section
    content.push('<div class="settings-section">');
    content.push('<h3>Undo Settings</h3>');

    // Enable/Disable Undo
    content.push('<div class="settings-group">');
    content.push(
      `<input type="checkbox" id="setting-undo-enabled" ${settings.isUndoEnabled() ? 'checked' : ''}/>`
    );
    content.push('<label for="setting-undo-enabled">Enable Undo System:</label>');
    content.push('</div>');

    // Max Undo Items
    content.push('<div class="settings-group">');
    content.push('<label>Maximum Undo Items:</label>');
    content.push(
      `<input type="number" id="setting-undo-maxitems" value="${settings.getMaxUndoItems()}" min="1" max="${Constants.MAX_UNDO_ITEMS}"/>`
    );
    content.push('</div>');

    // Undo Events
    content.push('<div class="settings-group">');
    content.push('<label>Enabled Undo Events:</label>');
    content.push('<div class="undo-events-list">');

    const undoEvents = [
      { id: UndoSystem.UNDO_EVT_LOAD, label: 'Load Pattern' },
      { id: UndoSystem.UNDO_EVT_EDIT, label: 'Edit Pattern' },
      { id: UndoSystem.UNDO_EVT_CLR, label: 'Clear Pattern' },
      { id: UndoSystem.UNDO_EVT_RUN, label: 'Run Animation' },
      { id: UndoSystem.UNDO_EVT_RUN1, label: 'Run 1 Step' },
      { id: UndoSystem.UNDO_EVT_RUNN, label: 'Run N Steps' },
      { id: UndoSystem.UNDO_EVT_RAND, label: 'Randomize' },
      { id: UndoSystem.UNDO_EVT_SEED, label: 'Apply Seed' },
      { id: UndoSystem.UNDO_EVT_RULE, label: 'Change CA Rule' },
      { id: UndoSystem.UNDO_EVT_SIZE, label: 'Resize Board' },
    ];

    undoEvents.forEach((evt) => {
      content.push('<div class="undo-event-item">');
      content.push(
        `<input type="checkbox" id="setting-undo-evt-${evt.id}" ${settings.isUndoEventEnabled(evt.id) ? 'checked' : ''}/>`
      );
      content.push(`<label for="setting-undo-evt-${evt.id}">${evt.label}</label>`);
      content.push('</div>');
    });

    content.push('</div>'); // end undo-events-list
    content.push('</div>'); // end settings-group
    content.push('</div>'); // end settings-section

    // Add event handlers after dialog is shown
    this.dialog.show('Settings', content.join(''));
    this.setupEventHandlers();
  }

  private applyTheme(theme: string) {
    settings.setTheme(theme as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  private setupEventHandlers() {
    // Theme setting
    const themeSelect = document.getElementById('setting-theme') as HTMLSelectElement;
    themeSelect?.addEventListener('change', () => {
      this.applyTheme(themeSelect.value as 'dark' | 'light');
    });

    // Palette setting
    const paletteSelect = document.getElementById('setting-palette') as HTMLSelectElement;
    paletteSelect?.addEventListener('change', () => {
      settings.setPaletteName(paletteSelect.value);
      gameState.setState({ isPaletteChanged: true });
      // board.drawBoard();
    });

    // Undo enabled setting
    const undoEnabled = document.getElementById('setting-undo-enabled') as HTMLInputElement;
    undoEnabled?.addEventListener('change', () => {
      settings.setUndoEnabled(undoEnabled.checked);
    });

    // Max undo items setting
    const maxItems = document.getElementById('setting-undo-maxitems') as HTMLInputElement;
    maxItems?.addEventListener('change', () => {
      settings.setMaxUndoItems(parseInt(maxItems.value, 10));
    });

    // Undo events settings
    const undoEvents = [
      UndoSystem.UNDO_EVT_LOAD,
      UndoSystem.UNDO_EVT_EDIT,
      UndoSystem.UNDO_EVT_CLR,
      UndoSystem.UNDO_EVT_RUN,
      UndoSystem.UNDO_EVT_RUN1,
      UndoSystem.UNDO_EVT_RUNN,
      UndoSystem.UNDO_EVT_RAND,
      UndoSystem.UNDO_EVT_SEED,
      UndoSystem.UNDO_EVT_RULE,
      UndoSystem.UNDO_EVT_SIZE,
    ];

    undoEvents.forEach((evt) => {
      const checkbox = document.getElementById(`setting-undo-evt-${evt}`) as HTMLInputElement;
      checkbox?.addEventListener('change', () => {
        if (checkbox.checked) {
          settings.enableUndoEvent(evt);
        } else {
          settings.disableUndoEvent(evt);
        }
      });
    });
  }
}

// Export singleton instance
export const settingsDialog = new SettingsDialog();
