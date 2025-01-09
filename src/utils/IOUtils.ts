/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// IOUtils.js
import { boardState } from '../core/BoardState.js';
import { diversities } from '../core/Diversities.js';
import { gameState } from '../core/GameState.js';
import { settings } from '../core/Settings.js';
import { patternLoader } from '../loaders/PatternLoader.js';
import { Toast } from '../ui/Toast.js';
import { CaPatternData } from './CaPatternData.js';
import MclBuilder from './MclBuilder.js';

export class IOUtils {
  static putPatternOnClipboard(description: string, saveSpeed: boolean, savePalette: boolean) {
    const patternData: CaPatternData = new CaPatternData();
    patternData.family = gameState.currentFamilyCode;
    patternData.description = description;
    patternData.boardSize = { width: boardState.lattice.width, height: boardState.lattice.height };
    patternData.rules = gameState.currentRuleDefinition;
    patternData.wrap = gameState.isWrap ? 1 : 0;
    patternData.colors = gameState.currentEngine.numStates;
    patternData.speed = saveSpeed ? gameState.speed : -1;
    patternData.palette = savePalette ? settings.getPaletteName() : '';
    patternData.diversities = [];
    if (diversities.isEnabled()) {
      patternData.diversities.push(...diversities.getConfigStrings());
    }

    const pattern = MclBuilder.buildCompleteFile(boardState.lattice, patternData);
    // console.log(pattern);

    // Put the text file on clipboard.
    navigator.clipboard
      .writeText(pattern)
      .then(() => {
        Toast.show('Pattern copied to Clipboard');
      })
      .catch((err) => {
        alert(`Failed to copy pattern text to Clipboard: ${err}`);
        console.error(`Failed to copy pattern text to Clipboard: ${err}`);
      });
  }

  static openPatternFromClipboard(onSuccess: (patternData: CaPatternData) => void) {
    navigator.clipboard
      .readText()
      .then((text) => {
        const patternData: CaPatternData = patternLoader.getPatternFromTextLines(text);
        if (patternData.loadSuccess) {
          patternData.fileName = 'Clipboard';
          onSuccess(patternData);
        } else {
          alert('The Clipboard does not contain valid pattern data');
        }
      })
      .catch((err) => {
        alert(`Failed to read pattern text from Clipboard: ${err}`);
        console.error(`Failed to read pattern text from Clipboard: ${err}`);
      });
  }

  static openPatternFromFile(file: File, onSuccess: (patternData: CaPatternData) => void) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const patternData: CaPatternData = patternLoader.getPatternFromTextLines(text);
      if (patternData.loadSuccess) {
        onSuccess(patternData);
      }
    };
    reader.readAsText(file);
  }

  static setupDragAndDrop(containerId: string, onSuccess: (patternData: CaPatternData) => void) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Error: Container not found:', containerId);
      return;
    }

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        IOUtils.openPatternFromFile(files[0], onSuccess);
      }
    });
  }
}
