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
import { Controls } from '../ui/Controls.js';

export class SettingsDialog {
  private dialog: typeof dialog;

  constructor() {
    this.dialog = dialog;
  }

  show() {
    const content = [];

    // Tabs navigation
    content.push('<div class="settings-tabs">');
    content.push('<button class="settings-tab active" data-tab="ui">UI</button>');
    content.push('<button class="settings-tab" data-tab="patterns">Patterns</button>');
    content.push('<button class="settings-tab" data-tab="undo">Undo</button>');
    content.push('</div>');

    // UI Settings tab
    content.push('<div class="settings-tab-content active" data-tab="ui">');
    content.push('<div class="settings-group-frame">');

    // theme
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

    // palette
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

    content.push('</div>'); // settings-group-frame
    content.push('</div>');

    // Patterns tab
    content.push('<div class="settings-tab-content" data-tab="patterns">');
    content.push('<div class="settings-group-frame">');

    // Default Palette
    content.push('<div class="settings-group">');
    content.push('<div>If pattern does not specify palette:</div>');
    content.push('<div class="pattern-default-option">');
    content.push(
      `<input type="radio" id="pattern-palette-keep" name="pattern-palette" value="keep" ${!settings.getPatternDefaults().useDefaultPalette ? 'checked' : ''}/>`
    );
    content.push('<label for="pattern-palette-keep">keep current</label>');
    content.push(
      `<input type="radio" id="pattern-palette-use" name="pattern-palette" value="use" ${settings.getPatternDefaults().useDefaultPalette ? 'checked' : ''}/>`
    );
    content.push('<label for="pattern-palette-use">use this:</label>');
    content.push('<select id="pattern-palette-default">');
    palettes.list.forEach((palette) => {
      content.push(
        `<option value="${palette.name}" ${settings.getPatternDefaults().defaultPalette === palette.name ? 'selected' : ''}>${palette.name}</option>`
      );
    });
    content.push('</select>');
    content.push('</div>');
    content.push('</div>');

    // Default Speed
    content.push('<div class="settings-group">');
    content.push('<div>If pattern does not specify speed:</div>');
    content.push('<div class="pattern-default-option">');
    content.push(
      `<input type="radio" id="pattern-speed-keep" name="pattern-speed" value="keep" ${!settings.getPatternDefaults().useDefaultSpeed ? 'checked' : ''}/>`
    );
    content.push('<label for="pattern-speed-keep">keep current</label>');
    content.push(
      `<input type="radio" id="pattern-speed-use" name="pattern-speed" value="use" ${settings.getPatternDefaults().useDefaultSpeed ? 'checked' : ''}/>`
    );
    content.push('<label for="pattern-speed-use">use this:</label>');
    content.push('<select id="pattern-speed-default">');
    const speeds = [0, 10, 25, 50, 100, 250, 500, 1000, 5000];
    speeds.forEach((speed) => {
      content.push(
        `<option value="${speed}" ${settings.getPatternDefaults().defaultSpeed === speed ? 'selected' : ''}>${speed}</option>`
      );
    });
    content.push('</select>');
    content.push('</div>');
    content.push('</div>');

    // Default Size Margin
    content.push('<div class="settings-group">');
    content.push('<div>If pattern does not specify board size:</div>');
    content.push('<div class="pattern-default-option">');
    content.push('<label>Add margin around pattern:</label>');
    content.push(
      `<input type="number" id="pattern-margin" value="${settings.getPatternDefaults().defaultSizeMargin}" min="0" max="1000"/>`
    );
    content.push('</div>');
    content.push('</div>');

    content.push('</div>'); // settings-group-frame
    content.push('</div>');

    // Undo Settings tab
    content.push('<div class="settings-tab-content" data-tab="undo">');

    content.push('<div class="settings-group">');
    content.push(
      `<input type="checkbox" id="setting-undo-enabled" ${settings.isUndoEnabled() ? 'checked' : ''}/>`
    );
    content.push('<label for="setting-undo-enabled">Enable Undo System</label>');
    content.push('</div>');

    content.push('<div class="settings-group-frame">');

    content.push('<div class="settings-group">');
    content.push('<label>Maximum Undo Items:</label>');
    content.push(
      `<input type="number" id="setting-undo-maxitems" value="${settings.getMaxUndoItems()}" min="1" max="${Constants.MAX_UNDO_ITEMS}"/>`
    );
    content.push('</div>');

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

    content.push('</div>'); // undo-events-list
    content.push('</div>'); // settings-group
    content.push('</div>'); // settings-group-frame
    content.push('</div>'); // undo tab content

    // Add event handlers after dialog is shown
    this.dialog.show('Settings', content.join(''));
    this.setupEventHandlers();
  }

  private applyTheme(theme: string) {
    settings.setTheme(theme as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  private setupEventHandlers() {
    // Add tab switching functionality
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.settings-tab').forEach((t) => t.classList.remove('active'));
        document
          .querySelectorAll('.settings-tab-content')
          .forEach((c) => c.classList.remove('active'));

        // Add active class to clicked tab and its content
        tab.classList.add('active');
        const tabName = tab.getAttribute('data-tab');
        document
          .querySelector(`.settings-tab-content[data-tab="${tabName}"]`)
          ?.classList.add('active');
      });
    });

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

    // Pattern default settings
    const patternPaletteKeep = document.getElementById('pattern-palette-keep') as HTMLInputElement;
    const patternPaletteUse = document.getElementById('pattern-palette-use') as HTMLInputElement;
    const patternPaletteDefault = document.getElementById(
      'pattern-palette-default'
    ) as HTMLSelectElement;
    const patternSpeedKeep = document.getElementById('pattern-speed-keep') as HTMLInputElement;
    const patternSpeedUse = document.getElementById('pattern-speed-use') as HTMLInputElement;
    const patternSpeedDefault = document.getElementById(
      'pattern-speed-default'
    ) as HTMLSelectElement;
    const patternMargin = document.getElementById('pattern-margin') as HTMLInputElement;

    // Palette default
    [patternPaletteKeep, patternPaletteUse].forEach((radio) => {
      radio?.addEventListener('change', () => {
        const useDefault = patternPaletteUse.checked;
        settings.setPatternDefaults({ useDefaultPalette: useDefault });
        patternPaletteDefault.disabled = !useDefault;
      });
    });

    patternPaletteDefault?.addEventListener('change', () => {
      settings.setPatternDefaults({ defaultPalette: patternPaletteDefault.value });
    });

    // Speed default
    [patternSpeedKeep, patternSpeedUse].forEach((radio) => {
      radio?.addEventListener('change', () => {
        const useDefault = patternSpeedUse.checked;
        settings.setPatternDefaults({ useDefaultSpeed: useDefault });
        patternSpeedDefault.disabled = !useDefault;
      });
    });

    patternSpeedDefault?.addEventListener('change', () => {
      settings.setPatternDefaults({ defaultSpeed: parseInt(patternSpeedDefault.value) });
    });

    // Margin default
    patternMargin?.addEventListener('change', () => {
      const value = Math.max(0, Math.min(1000, parseInt(patternMargin.value) || 0));
      patternMargin.value = value.toString();
      settings.setPatternDefaults({ defaultSizeMargin: value });
    });

    // Set initial disabled states
    patternPaletteDefault.disabled = !settings.getPatternDefaults().useDefaultPalette;
    patternSpeedDefault.disabled = !settings.getPatternDefaults().useDefaultSpeed;
  }
}

// Export singleton instance
export const settingsDialog = new SettingsDialog();
