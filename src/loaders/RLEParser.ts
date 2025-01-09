/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// RLEParser.js - Handles parsing of RLE pattern files
import { CaPatternData, LoadedCell } from '../utils/CaPatternData.js';

export class RLEParser {
  static parseRLE(content: string, patternData: CaPatternData): boolean {
    const lines = content.split('\n');

    const state = {
      col: 0,
      row: 0,
      iniCol: 0,
      num: 0,
      endFlag: false,
      xyFound: false,
    };

    let description: string[] = [];
    let cells: LoadedCell[] = [];
    let loadSuccess = false;

    // Most RLE patterns do not contain any headers
    patternData.setRules('23/3');

    // Process each line
    for (const line of lines) {
      if (this.processRLELine(line, state, cells, description, patternData)) {
        loadSuccess = true;
      }
    }

    // Convert cells array to 2D grid format
    if (loadSuccess) {
      const grid = CaPatternData.convertLoadedCellsToGrid(cells);
      patternData.setLoadedCells(grid);
    } else {
      patternData.setLoadedCells([]);
    }

    patternData.setDescription(description.join('\n')).setLoadSuccess(loadSuccess);

    return loadSuccess;
  }

  static processRLELine(
    line: string,
    state: any,
    cells: LoadedCell[],
    description: string[],
    patternData: CaPatternData
  ): boolean {
    let success = false;
    line = line.trim();

    if (!line) return success;

    if (line.startsWith('#D') || line.startsWith('#C')) {
      let comment = line.substring(2).trim();
      description.push(comment);
    } else if (state.endFlag) {
      description.push(line);
    } else if (line.length > 0) {
      if (!state.xyFound && line.startsWith('x')) {
        state.xyFound = true;
        success = true;

        // Parse header line like "x = 97, y = 66"
        const parts = line.split(',');
        for (const part of parts) {
          const [key, value] = part.split('=').map((s) => s.trim());
          if (key === 'x') {
            state.iniCol = state.col = -Math.abs(parseInt(value)) / 2;
          } else if (key === 'y') {
            state.row = -Math.abs(parseInt(value)) / 2;
          } else if (key === 'rule' || key === 'rules') {
            patternData.setRules(value);
          }
        }
      } else {
        // Process pattern data
        for (let i = 0; i < line.length && !state.endFlag; i++) {
          const char = line[i];
          if (char >= '0' && char <= '9') {
            // char - '0'
            state.num = state.num * 10 + (char.charCodeAt(0) - '0'.charCodeAt(0));
          } else {
            if (state.num === 0) state.num = 1;

            switch (char) {
              case '$':
                state.row += state.num;
                state.col = state.iniCol;
                break;

              case 'b':
              case 'B':
              case '.':
                state.col += state.num;
                break;

              case '!':
                state.endFlag = true;
                break;

              default:
                if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
                  let cellType = 1;
                  switch (char.toUpperCase()) {
                    case 'X':
                      cellType = 2;
                      break;
                    case 'Y':
                      cellType = 3;
                      break;
                    case 'Z':
                      cellType = 4;
                      break;
                  }

                  for (let j = 0; j < state.num; j++) {
                    cells.push({ x: state.col + j, y: state.row, state: cellType });
                  }

                  state.col += state.num;
                  success = true;
                }
            }
            state.num = 0;
          }
        }
      }
    }
    return success;
  }
}
