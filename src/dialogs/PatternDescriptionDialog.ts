/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// PatternDescriptionDialog.js
import { gameState } from '../core/GameState.js';
import { CaPatternData } from '../utils/CaPatternData.js';
import { Dialog } from './Dialog.js';

export class PatternDescriptionDialog extends Dialog {
  constructor() {
    super();
  }

  show(title: string, text: string, data: CaPatternData) {
    // Lookup the official rule name in the lexicon
    const lexEntry = gameState.lexicon.getEntry(data.family, data.rules);
    let ruleName = 'Unknown';
    if (lexEntry) {
      ruleName = lexEntry.ruleName;
    }

    const content = `
        <div class="pattern-description-dialog">
          ${text}
          <hr>
          <small>-----
          <div>
            <b>CA family:</b> ${data.family}
          </div>
          <div>
            <b>Rule:</b> ${ruleName}
          </div>
          <div>
            <b>Rule definition:</b> ${data.rules}
          </div>
          </small>
        </div>
      `;

    super.show(title, content);
  }
}

export const patternDescriptionDialog = new PatternDescriptionDialog();
