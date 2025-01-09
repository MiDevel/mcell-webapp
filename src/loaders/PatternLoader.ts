/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// PatternLoader.js - Handles loading and parsing of CA pattern files
import { CaPatternData } from '../utils/CaPatternData.js';
import { MCLParser } from './MCLParser.js';
import { Life105Parser } from './Life105Parser.js';
import { Life103Parser } from './Life103Parser.js';
import { RLEParser } from './RLEParser.js';
import { Toast } from '../ui/Toast.js';

export class PatternLoader {
  description: string;
  patternData: CaPatternData | null;

  constructor() {
    this.description = '';
    this.patternData = null;
  }

  async loadPatternFromFile(patternPath: string) {
    // console.log('Loading pattern file:', patternPath);
    try {
      // Ensure forward slashes for URLs
      const normalizedPath = patternPath.replace(/\\/g, '/');

      const response = await fetch(`data/patterns/${normalizedPath}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();

      const patternData = this.getPatternFromTextLines(content);
      patternData.fileName = patternPath.split('/').pop()!;
      return patternData;
    } catch (error) {
      console.error('Error loading pattern:', error);
      Toast.show(`Error loading pattern: ${error}`);
      return null;
    }
  }

  getPatternFromTextLines(text: string): CaPatternData {
    this.patternData = new CaPatternData();

    let firstLine = ''; // First non-comment line in the file
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (
        trimmedLine &&
        !trimmedLine.startsWith('#C') &&
        !trimmedLine.startsWith('#D') &&
        !trimmedLine.startsWith('!')
      ) {
        firstLine = trimmedLine;
        break;
      }
    }

    // Try each parser in sequence
    if (firstLine.startsWith('#MCell') || firstLine.startsWith('#MCLife')) {
      MCLParser.parseMCLFile(text, this.patternData);
    } else if (
      firstLine.startsWith('#Life 1.05') ||
      firstLine.startsWith('#Life 1.02') ||
      firstLine.startsWith('#P')
    ) {
      Life105Parser.parseLife105(text, this.patternData);
    } else if (firstLine.startsWith('#Life 1.03') || firstLine.startsWith('#Life 1.06')) {
      Life103Parser.parseLife103(text, this.patternData);
    } else if (firstLine.startsWith('x')) {
      RLEParser.parseRLE(text, this.patternData);
    }

    // Try classical parsers again as a last resort if the file
    // does not start with valid headers.
    if (!this.patternData.loadSuccess) {
      Life105Parser.parseLife105(text, this.patternData);
    }
    if (!this.patternData.loadSuccess) {
      Life103Parser.parseLife103(text, this.patternData);
    }
    if (!this.patternData.loadSuccess) {
      RLEParser.parseRLE(text, this.patternData);
    }

    if (this.patternData.loadSuccess) {
      this.adjustBoardSize(this.patternData);
    }

    // console.log('Parsed pattern data:', {
    //     loadSuccess: this.patternData.loadSuccess,
    //     description: this.patternData.description.length + ' chars',
    //     cells: this.patternData.loadedCells.length + ' cols x ' + this.patternData.loadedCells[0].length + ' rows',
    //     boardSize: this.patternData.boardSize,
    //     rules: this.patternData.rules,
    // });
    return this.patternData;
  }

  adjustBoardSize(patternData: CaPatternData) {
    const { width, height } = patternData.boardSize;

    // If board size is not specified or invalid
    if (width <= 0 || height <= 0) {
      const cells = patternData.loadedCells;
      if (cells && cells.length > 0) {
        const boundingWidth = cells.length;
        const boundingHeight = cells[0].length;

        // Add padding of 120 cells
        patternData.setBoardSize({
          width: boundingWidth + 120,
          height: boundingHeight + 120,
        });
      } else {
        // Default size if no cells
        patternData.setBoardSize({ width: 100, height: 100 });
      }
    }
  }

  getDescriptionHTML() {
    return this.patternData?.description.replace(/\n/g, '<br>') || 'No description available.';
  }

  // Load the must-see patterns list
  async loadMustSeePatterns() {
    try {
      const response = await fetch('data/mustsee.txt');
      if (!response.ok) {
        throw new Error(`loadMustSeePatterns error! status: ${response.status}`);
      }
      const fileList = await response.text();

      const patterns = [];
      const lines = fileList.split('\n');

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('//')) continue;

        const parts = line.split('/');
        if (parts.length >= 3) {
          const family = parts[0];
          const displayName = `${parts[1]}/${parts[2].split('.')[0]}`;
          patterns.push({
            family: family,
            displayName: displayName,
            path: line,
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error loading must-see patterns:', error);
      return [];
    }
  }
}

export const patternLoader = new PatternLoader();
