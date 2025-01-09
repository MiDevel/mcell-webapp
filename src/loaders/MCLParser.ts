/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// MCLParser.js - Handles parsing of MCL pattern files
import { CaPatternData } from '../utils/CaPatternData.js';

export class MCLParser {
  // Parse the content of an MCL file into a CaPatternData object
  // MCL file example:
  //   #MCell 4.00
  //   #GAME Margolus
  //   #RULE MS,D0;4;8;12;4;12;12;13;8;12;12;14;12;13;14;15
  //   #BOARD 100x100
  //   #SPEED 20
  //   #WRAP 0
  //   #CCOLORS 8
  //   #DIV #SYSTEM,act=1
  //   #DIV #STRIN,act=1,rep=1,x=0,y=-40,str=1,0,0,0
  //   #D Sand simulation.
  //   #D
  //   #D To get most of the rule use the "Diversities/Stream injection"
  //   #D to produce a steady stream of new cells.
  //   #D
  //   #D A rule by Mirek Wojtowicz, April 2000
  //   #L 31.C23$27.3C$30.CC$32.CC$34.C$35.CC$37.3C13$44.CC$41.3C$39.CC$37.CC$
  //   #L 36.C$34.CC$33.C$32.CC$32.C14$3.5C46.5C$.3C3.CC44.CC3.3C$CC7.CC40.CC7.
  //   #L CC$C9.CC15.6C17.CC9.C$C10.CC36.CC10.C$C11.CC34.CC11.C$.C11.C34.C11.C$
  //   #L 13.CC32.CC$14.C32.C$14.CC30.CC$15.CC28.CC$16.C28.C$16.CC26.CC$17.CC24.
  //   #L CC$18.CC22.CC$19.CC20.CC$20.3C16.3C$21.20C$22.18C$24.14C
  static parseMCLFile(content: string, patternData: CaPatternData): boolean {
    const lines = content.split('\n');
    let rules: string = '';
    let description: string[] = [];
    let cells: number[][] = [];
    let cellContent: string = '';
    let loadSuccess: boolean = false;

    let inDescription = false;
    let inCells = false;

    for (let line of lines) {
      line = line.trim();

      if (line.startsWith('#MCell')) {
        continue;
      } else if (line.startsWith('#GAME')) {
        const gameName = line.substring(line.indexOf(' ') + 1).trim();
        patternData.setFamily(gameName);
      } else if (line.startsWith('#BOARD')) {
        const [_, width, height] = line.match(/#BOARD\s*(\d+)x(\d+)/) || [null, '0', '0'];
        patternData.setBoardSize({ width: parseInt(width), height: parseInt(height) });
      } else if (line.startsWith('#RULE')) {
        rules += line.split(' ')[1];
      } else if (line.startsWith('#WRAP')) {
        patternData.setWrap(line.split(' ')[1] === '1' ? 1 : 0);
      } else if (line.startsWith('#SPEED')) {
        patternData.setSpeed(parseInt(line.split(' ')[1]));
      } else if (line.startsWith('#DIV')) {
        patternData.addDiversity(line.substring(5));
      } else if (line.startsWith('#D')) {
        inDescription = true;
        const desc = line.substring(2).trim();
        description.push(desc);
      } else if (line.startsWith('#L')) {
        inDescription = false;
        inCells = true;
        cellContent += line.substring(2).trim();
      } else if (line.startsWith('#PALETTE')) {
        const paletteName = line.substring(line.indexOf(' ') + 1).trim();
        patternData.setPalette(paletteName);
      } else if (inDescription && line) {
        description.push(line);
      } else if (inCells && line) {
        cellContent += line;
      }
    }

    if (cellContent) {
      loadSuccess = true;
      cells = this.parseMCLDataLine(cellContent);
    }

    // Fill any missing columns with zeros to make all rows the same length
    const maxWidth = Math.max(...cells.map((row) => row.length));
    cells = cells.map((row) => {
      while (row.length < maxWidth) {
        row.push(0);
      }
      return row;
    });

    // Swap rows and columns
    cells = cells[0].map((_, col) => cells.map((row) => row[col]));

    patternData
      .setRules(rules)
      .setDescription(description.join('\n'))
      .setLoadedCells(cells)
      .setLoadSuccess(loadSuccess);

    return loadSuccess;
  }

  // Parse a single line of MCL data into an array of cell states
  // Each cell state is represented by a number from 0 to 255
  //   state 0 = empty (.)
  //   states 1-24 = base states (A-X)
  //   states 25-256 = extended states enoded with two characters:
  //     a multiplier (a-j) and a base state (A-X)
  //     where 'a' adds 24, 'b' adds 2*24 (48), etc
  //     examples: aA = 25, bA = 49, cA = 73, etc
  // A '$' character indicates the end of a row
  // Trailing '.' characters are ignored and usually skipped
  // Example: "3A2B$2C" => [[1, 1, 1, 2, 2], [3, 3]]
  static parseMCLDataLine(line: string): number[][] {
    const cells: number[][] = []; // Array of rows of cells' states
    let currentRow: number[] = []; // Current row of cells' states
    let count = 0;
    let stateAdd = 0; // for states > 24 (a-j)
    let col = 0;

    line = line.trim();
    if (!line) return cells;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char >= '0' && char <= '9') {
        count = count * 10 + (char.charCodeAt(0) - '0'.charCodeAt(0));
      } else if (char === '.') {
        if (count === 0) count = 1;
        col += count;
        count = 0;
      } else if (char >= 'a' && char <= 'j') {
        // Handle extended states (a-j add multiples of 24 to the state)
        stateAdd = (char.charCodeAt(0) - 'a'.charCodeAt(0) + 1) * 24;
      } else if (char >= 'A' && char <= 'X') {
        if (count === 0) count = 1;
        const state = char.charCodeAt(0) - 'A'.charCodeAt(0) + 1 + stateAdd;

        // Fill the gaps with zeros
        while (currentRow.length < col) {
          currentRow.push(0);
        }

        // Add cells with the current state
        for (let j = 0; j < count; j++) {
          currentRow.push(state);
        }

        col += count;
        stateAdd = 0;
        count = 0;
      } else if (char === '$') {
        // End of row
        if (count === 0) count = 1;

        // Complete the current row
        cells.push(currentRow);

        // Add empty rows if specified
        for (let j = 1; j < count; j++) {
          cells.push([]);
        }

        // Reset for next row
        currentRow = [];
        col = 0;
        count = 0;
      }
    }

    // Add the last row if not empty
    if (currentRow.length > 0) {
      cells.push(currentRow);
    }

    return cells;
  }
}
