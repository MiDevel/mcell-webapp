/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// RulesDialog.js
import { dialog, TDialog } from './Dialog.js';
import { CaLexicon } from '../core/CaLexicon.js';
import { undoSystem, UndoSystem } from '../core/UndoSystem.js';
import { caEngines } from '../core/CaEngines.js';

export class RulesDialog {
  dialog: TDialog;
  familySelect: HTMLSelectElement | null = null;
  ruleSelect: HTMLSelectElement | null = null;
  ruleDefinitionInput: HTMLInputElement | null = null;
  ruleDescriptionArea: HTMLTextAreaElement | null = null;
  private onAcceptCallback:
    | ((familyCode: string, ruleDefinition: string, ruleName: string) => void)
    | null = null;

  constructor() {
    this.dialog = dialog;
  }

  createDialogContent(): string {
    return `
            <div class="dialog-content rules-dialog">
                <div class="form-group">
                    <label>CA Family:</label>
                    <select id="familySelect" class="full-width"></select>
                </div>
                <div class="form-group">
                    <label>Rule:</label>
                    <select id="ruleSelect" class="full-width"></select>
                </div>
                <div class="form-group">
                    <label>Rule Definition:</label>
                    <div class="input-with-buttons">
                        <input type="text" id="ruleDefinition" class="full-width">
                        <button id="copyBtn" title="Copy to clipboard">📋</button>
                        <button id="randomBtn" title="Generate random rule">🎲</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="ruleDescription" class="full-width dark-mode-textarea" rows="4" readonly></textarea>
                </div>
                <div class="dialog-buttons">
                    <button class="primary" id="acceptBtn">Accept</button>
                    <button id="closeBtn">Close</button>
                </div>
            </div>`;
  }

  show(
    startFamilyCode: string,
    startRuleDefinition: string,
    onAccept?: (familyCode: string, ruleDefinition: string, ruleName: string) => void
  ) {
    this.onAcceptCallback = onAccept || null;
    this.dialog.show('Rules', this.createDialogContent());

    // Get DOM elements
    this.familySelect = document.getElementById('familySelect') as HTMLSelectElement;
    this.ruleSelect = document.getElementById('ruleSelect') as HTMLSelectElement;
    this.ruleDefinitionInput = document.getElementById('ruleDefinition') as HTMLInputElement;
    this.ruleDescriptionArea = document.getElementById('ruleDescription') as HTMLTextAreaElement;

    // Populate family options
    caEngines.engines.forEach((engine) => {
      const option = document.createElement('option');
      option.value = engine.code;
      option.text = engine.code;
      this.familySelect?.appendChild(option);
    });

    // Set current family
    if (this.familySelect) {
      this.familySelect.value = startFamilyCode;
    }

    // Set up event handlers
    this.familySelect?.addEventListener('change', () => this.onFamilyChange());
    this.ruleSelect?.addEventListener('change', () => this.onRuleChange());
    document.getElementById('randomBtn')?.addEventListener('click', () => this.onRandomClick());
    document.getElementById('copyBtn')?.addEventListener('click', () => this.onCopyClick());
    document.getElementById('acceptBtn')?.addEventListener('click', () => this.onAccept());
    document.getElementById('closeBtn')?.addEventListener('click', () => this.dialog.close());

    // Initialize with current state
    this.populateRuleDropdown();
    this.setCurrentRule(startFamilyCode, startRuleDefinition);
  }

  onFamilyChange() {
    this.populateRuleDropdown();

    // Get the first rule of the family
    const familyCode = this.familySelect?.value || '';
    const entries = new CaLexicon().getEntries(familyCode);
    if (entries.length > 0) {
      const firstRule = entries[0];
      if (this.ruleSelect) this.ruleSelect.value = firstRule.ruleName;
      if (this.ruleDefinitionInput) this.ruleDefinitionInput.value = firstRule.ruleDefinition;
      if (this.ruleDescriptionArea) this.ruleDescriptionArea.value = firstRule.ruleDescription;
    }
  }

  onRuleChange() {
    const selectedRule = this.ruleSelect?.value;
    if (!selectedRule || selectedRule === 'other') return;

    const familyCode = this.familySelect?.value || '';
    const entries = new CaLexicon().getEntries(familyCode);
    const entry = entries.find((e) => e.ruleName === selectedRule);

    if (entry) {
      this.ruleDefinitionInput!.value = entry.ruleDefinition;
      this.ruleDescriptionArea!.value = entry.ruleDescription;
    }
  }

  onRandomClick() {
    this.generateRandomRule();
  }

  onCopyClick() {
    if (this.ruleDefinitionInput?.value) {
      navigator.clipboard
        .writeText(this.ruleDefinitionInput.value)
        .catch((err) => console.error('Failed to copy text: ', err));
    }
  }

  onAccept() {
    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_RULE);

    const familyCode = this.familySelect?.value || '';
    const ruleDefinition = this.ruleDefinitionInput?.value || '';
    const ruleName = this.ruleSelect?.value || '';

    this.dialog.close();

    // Call the callback if it exists
    this.onAcceptCallback?.(familyCode, ruleDefinition, ruleName);
  }

  populateRuleDropdown() {
    if (!this.ruleSelect) return;

    // Clear existing options
    this.ruleSelect.innerHTML = '';

    // Add "Other rule" option
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.text = 'Other rule';
    this.ruleSelect.appendChild(otherOption);

    // Add predefined rules
    const familyCode = this.familySelect?.value || '';
    const entries = new CaLexicon().getEntries(familyCode);
    entries.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.ruleName;
      option.text = entry.ruleName;
      this.ruleSelect?.appendChild(option);
    });
  }

  setCurrentRule(startFamilyCode: string, startRuleDefinition: string) {
    if (!this.ruleDefinitionInput) return;

    // Set current rule definition
    this.ruleDefinitionInput.value = startRuleDefinition;

    // Find if it's a predefined rule
    const entry = new CaLexicon().getEntry(startFamilyCode, startRuleDefinition);

    if (entry) {
      // It's a predefined rule
      if (this.ruleSelect) this.ruleSelect.value = entry.ruleName;
      if (this.ruleDescriptionArea) this.ruleDescriptionArea.value = entry.ruleDescription;
    } else {
      // It's a custom rule
      if (this.ruleSelect) this.ruleSelect.value = 'other';
      if (this.ruleDescriptionArea) this.ruleDescriptionArea.value = '';
    }
  }

  generateRandomRule() {
    const familyCode = this.familySelect?.value || '';
    const engine = caEngines.getEngineForFamily(familyCode);
    if (!engine) return;

    const randomDef = engine.randomRule();
    if (this.ruleDefinitionInput) {
      this.ruleDefinitionInput.value = randomDef;
    }

    // Check if random rule matches any predefined rule
    const entry = new CaLexicon().getEntry(familyCode, randomDef);
    if (entry) {
      if (this.ruleSelect) this.ruleSelect.value = entry.ruleName;
      if (this.ruleDescriptionArea) this.ruleDescriptionArea.value = entry.ruleDescription;
    } else {
      if (this.ruleSelect) this.ruleSelect.value = 'other';
      if (this.ruleDescriptionArea) this.ruleDescriptionArea.value = '';
    }
  }
}

export const rulesDialog = new RulesDialog();
