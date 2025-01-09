/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// DiversitiesDialog.js
import { dialog } from './Dialog.js';
import { diversities, DiversitiesSettings } from '../core/Diversities.js';

export class DiversitiesDialog {
  dialog: any;

  constructor() {
    this.dialog = dialog;
  }

  createDialog(settings: DiversitiesSettings) {
    const content = `
            <div class="dialog-content">
                <div class="form-group">
                    <label class="main-switch">
                        <input type="checkbox" id="diversitiesEnabled" ${settings.enabled ? 'checked' : ''}>
                        Diversities active
                    </label>
                </div>

                <div class="diversity-sections">
                    <!-- Noise Section -->
                    <div class="section">
                        <div class="section-header">
                            <h3>Noise</h3>
                            <label class="section-active">
                                <input type="checkbox" class="section-active" id="noiseActive" ${settings.noise.active ? 'checked' : ''}>
                                Active
                            </label>
                        </div>
                        <div class="section-content">
                            <div class="input-group">
                                <label>Every
                                    <input type="number" id="noiseCycles" value="${settings.noise.cycles}" min="1" class="inline-input">
                                    cycle(s) generate
                                </label>
                                <label>
                                    <input type="number" id="noiseCells" value="${settings.noise.cells}" min="1" class="inline-input">
                                    random cell(s)
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Black Hole Section -->
                    <div class="section">
                        <div class="section-header">
                            <h3>Black hole</h3>
                            <label class="section-active">
                                <input type="checkbox" class="section-active" id="blackHoleActive" ${settings.blackHole.active ? 'checked' : ''}>
                                Active
                            </label>
                        </div>
                        <div class="section-content">
                            <div class="input-group">
                                <label>Center point:
                                    <input type="number" id="blackHoleX" value="${settings.blackHole.x}" class="inline-input">,
                                    <input type="number" id="blackHoleY" value="${settings.blackHole.y}" class="inline-input">
                                </label>
                                <label>Size:
                                    <input type="number" id="blackHoleSize" value="${settings.blackHole.size}" min="1" class="inline-input">
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- SuperNova Section -->
                    <div class="section">
                        <div class="section-header">
                            <h3>SuperNova</h3>
                            <label class="section-active">
                                <input type="checkbox" class="section-active" id="superNovaActive" ${settings.superNova.active ? 'checked' : ''}>
                                Active
                            </label>
                        </div>
                        <div class="section-content">
                            <div class="input-group">
                                <label>Center point:
                                    <input type="number" id="superNovaX" value="${settings.superNova.x}" class="inline-input">,
                                    <input type="number" id="superNovaY" value="${settings.superNova.y}" class="inline-input">
                                </label>
                                <label>Size:
                                    <input type="number" id="superNovaSize" value="${settings.superNova.size}" min="1" class="inline-input">
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Stream Input Section -->
                    <div class="section">
                        <div class="section-header">
                            <h3>Input stream</h3>
                            <label class="section-active">
                                <input type="checkbox" class="section-active" id="streamInputActive" ${settings.streamInput.active ? 'checked' : ''}>
                                Active
                            </label>
                        </div>
                        <div class="section-content">
                            <div class="input-group">
                                <label>Location:
                                    <input type="number" id="streamInputX" value="${settings.streamInput.x}" class="inline-input">,
                                    <input type="number" id="streamInputY" value="${settings.streamInput.y}" class="inline-input">
                                </label>
                                <label>
                                    <input type="checkbox" id="streamInputRepeat" ${settings.streamInput.repeat ? 'checked' : ''}>
                                    Repeat forever
                                </label>
                                <div class="input-line">
                                    <span>Stream:</span>
                                    <input type="text" id="streamInputStr" value="${settings.streamInput.str.join(', ')}" class="stream-input">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dialog-buttons">
                    <button class="primary" id="acceptBtn">Accept</button>
                    <button id="closeBtn">Close</button>
                </div>
            </div>`;

    return content;
  }

  show() {
    const settings = diversities.settings;
    const content = this.createDialog(settings);
    this.dialog.show('Diversities', content);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const diversitiesEnabled: HTMLInputElement = document.getElementById(
      'diversitiesEnabled'
    ) as HTMLInputElement;
    const sections: NodeListOf<HTMLElement> = document.querySelectorAll('.section-content');
    const sectionCheckboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll(
      '.section-active input[type="checkbox"]'
    );

    if (!diversitiesEnabled) throw new Error('diversitiesEnabled is not defined');
    if (!sections) throw new Error('sections is not defined');
    if (!sectionCheckboxes) throw new Error('sectionCheckboxes is not defined');

    // Main switch functionality
    diversitiesEnabled.addEventListener('change', () => {
      const enabled = diversitiesEnabled.checked;
      sections.forEach((section) => {
        section.style.opacity = enabled ? '1' : '0.5';
        section.querySelectorAll('input').forEach((input) => {
          input.disabled = !enabled;
        });
      });
      sectionCheckboxes.forEach((checkbox) => {
        checkbox.disabled = !enabled;
      });
    });

    // Initial state
    if (!diversitiesEnabled.checked) {
      sections.forEach((section) => {
        section.style.opacity = '0.5';
        section.querySelectorAll('input').forEach((input) => {
          input.disabled = true;
        });
      });
      sectionCheckboxes.forEach((checkbox) => {
        checkbox.disabled = true;
      });
    }

    // Accept button
    document.getElementById('acceptBtn')!.addEventListener('click', () => {
      const newSettings: DiversitiesSettings = new DiversitiesSettings();
      newSettings.enabled = diversitiesEnabled.checked;
      newSettings.noise = {
        active: (document.getElementById('noiseActive') as HTMLInputElement)!.checked,
        cycles: (document.getElementById('noiseCycles') as HTMLInputElement)!.valueAsNumber,
        cells: (document.getElementById('noiseCells') as HTMLInputElement)!.valueAsNumber,
        state: 1,
      };
      newSettings.blackHole = {
        active: (document.getElementById('blackHoleActive') as HTMLInputElement)!.checked,
        x: (document.getElementById('blackHoleX') as HTMLInputElement)!.valueAsNumber,
        y: (document.getElementById('blackHoleY') as HTMLInputElement)!.valueAsNumber,
        size: (document.getElementById('blackHoleSize') as HTMLInputElement)!.valueAsNumber,
      };
      newSettings.superNova = {
        active: (document.getElementById('superNovaActive') as HTMLInputElement)!.checked,
        x: (document.getElementById('superNovaX') as HTMLInputElement)!.valueAsNumber,
        y: (document.getElementById('superNovaY') as HTMLInputElement)!.valueAsNumber,
        size: (document.getElementById('superNovaSize') as HTMLInputElement)!.valueAsNumber,
        state: 1,
      };
      newSettings.streamInput = {
        active: (document.getElementById('streamInputActive') as HTMLInputElement)!.checked,
        repeat: (document.getElementById('streamInputRepeat') as HTMLInputElement)!.checked,
        x: (document.getElementById('streamInputX') as HTMLInputElement)!.valueAsNumber,
        y: (document.getElementById('streamInputY') as HTMLInputElement)!.valueAsNumber,
        str: (document.getElementById('streamInputStr') as HTMLInputElement)!.value
          .split(',')
          .map((s) => parseInt(s.trim())),
      };
      diversities.settings.setSettings(newSettings);
      this.dialog.close();
    });

    // Close button
    document.getElementById('closeBtn')!.addEventListener('click', () => {
      this.dialog.close();
    });
  }
}

export const diversitiesDialog = new DiversitiesDialog();
