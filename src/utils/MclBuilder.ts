/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// MclBuilder.js - Handles building of MCL pattern files
import { Lattice } from '../core/Lattice.js';
import { CaPatternData } from './CaPatternData.js';
import { StringBuilder } from './StringBuilder.js';

export default class MclBuilder {
  private static getMclChar(state: number): string {
    if (state < 0) return '$'; // end of row

    if (state === 0) return '.'; // empty cell (state 0)

    // base states (A-X)
    if (state <= 24) return String.fromCharCode('A'.charCodeAt(0) + state - 1);

    // extended states 25-256
    if (state > 256) state = 256;
    let multiplier = Math.floor((state - 25) / 24);
    let base = ((state - 25) % 24) + 1;
    return (
      String.fromCharCode('a'.charCodeAt(0) + multiplier) +
      String.fromCharCode('A'.charCodeAt(0) + base - 1)
    );
  }

  public static build(lattice: Lattice): {
    pattern: string;
    numAlive: number;
    x: number;
    y: number;
  } {
    // find the bounding box
    let { minY, maxY, minX, maxX } = lattice.getBoundingRect();

    const result = MclBuilder.buildForArea(lattice, minY, maxY, minX, maxX);
    return {
      ...result,
      x: minX,
      y: minY,
    };
  }

  // Builds the MCL pattern for the alive area of the lattice.
  // Each cell state is represented by a number from 0 to 255
  //   state 0 = empty (.)
  //   states 1-24 = base states (A-X)
  //   states 25-256 = extended states enoded with two characters:
  //     a multiplier (a-j) and a base state (A-X)
  //     where 'a' adds 24, 'b' adds 2*24 (48), etc
  //     examples: aA = 25, bA = 49, cA = 73, etc
  // A '$' character indicates the end of a row
  // Trailing '.' characters are ignored and usually skipped
  //
  // Example 1:
  //   1 1 3 3 3
  //   0 0 0 0 0
  //   0 0 0 0 0
  //   0 0 0 0 0
  //   1 1 1 1 1
  //   1 3 3 3 1
  // produces "AA3C4$5A$A3CA"
  //
  // Example 2:
  //   1, 1, 1, 2, 2
  //   3, 3, 0, 0, 0
  // produces "3A2B$2C"
  //
  static buildForArea(
    lattice: Lattice,
    minY: number,
    maxY: number,
    minX: number,
    maxX: number
  ): { pattern: string; numAlive: number } {
    function appendToken(count: number, c: string) {
      if (count === 0) return;
      if (count === 1) builder.append(c);
      if (count === 2) builder.append(c + c);
      if (count > 2) {
        builder.append(count.toString());
        builder.append(c);
      }
    }

    const builder = new StringBuilder();
    let numAlive = 0;
    let bCnt = 0; // number of blank ('.') characters
    let eCnt = 0; // number of end-of-row ('$') characters
    let aCnt = 0; // number of alive cells
    let lastTyp: string = '$'; // '$', '.', 'A'..'X', 'aA'..'jX'
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        let thisState = lattice.getCell(x, y);
        let thisTyp = MclBuilder.getMclChar(thisState);

        if (thisState > 0) {
          // alive cell
          numAlive++;
          if (lastTyp !== thisTyp) {
            // a change, output what was collected
            appendToken(eCnt, '$');
            appendToken(bCnt, '.');
            appendToken(aCnt, lastTyp);
            aCnt = 1; // the first cell of this type
            bCnt = 0;
            eCnt = 0;
          } else {
            aCnt++; // the next cell of last type
          }
          lastTyp = thisTyp;
        } else {
          // empty cell
          if (lastTyp !== '$' && lastTyp !== '.') {
            appendToken(aCnt, lastTyp);
            aCnt = 0;
          }
          bCnt++;
          lastTyp = '.';
        }
      } // for x
      if (lastTyp !== '$' && lastTyp !== '.') {
        appendToken(aCnt, lastTyp);
      }
      bCnt = 0;
      aCnt = 0;
      eCnt++;
      lastTyp = '$';
    } // for y

    return { pattern: builder.toString(), numAlive: numAlive };
  }

  // Builds the MCL file pattern for the entire lattice
  // Example:
  //   #MCell 4.20
  //   #GAME Generations
  //   #RULE 345/2/4
  //   #BOARD 40x40
  //   #SPEED 10
  //   #WRAP 1
  //   #CCOLORS 4
  //   #PALETTE 8 colors
  //   #DIV #SYSTEM,act=1
  //   #DIV #STRIN,act=1,rep=1,x=0,y=-40,str=1,0,0,0
  //   #D Oscillators being used to reflect signals.
  //   #D
  //   #D John Smith, December 1999
  //   #L ABC$ABC$.ABC$.ABC
  static buildCompleteFile(lattice: Lattice, patternData: CaPatternData): string {
    const { pattern: patternText } = MclBuilder.build(lattice);
    const x = lattice.width;
    const y = lattice.height;
    const game = patternData.family;
    const rule = patternData.rules;
    const wrap = patternData.wrap;
    const colors = patternData.colors;

    const sb = new StringBuilder();
    sb.append('#MCell 4.20\n');
    sb.append(`#GAME ${game}\n`);
    sb.append(`#RULE ${rule}\n`);
    sb.append(`#BOARD ${x}x${y}\n`);
    sb.append(`#WRAP ${wrap}\n`);
    sb.append(`#CCOLORS ${colors}\n`);

    if (patternData.speed >= 0) {
      sb.append(`#SPEED ${patternData.speed}\n`);
    }

    if (patternData.palette) {
      sb.append(`#PALETTE ${patternData.palette}\n`);
    }

    if (patternData.diversities.length > 0) {
      for (let div of patternData.diversities) {
        sb.append(`#DIV ${div}\n`);
      }
    }

    // multiline description
    if (patternData.description) {
      const lines = patternData.description.split('\n');
      for (let line of lines) {
        sb.append(`#D ${line}\n`);
      }
    }

    // split the pattern into lines of max 70 characters
    const lines = patternText.match(/.{1,70}/g);
    if (lines) {
      for (let line of lines) {
        sb.append(`#L ${line}\n`);
      }
    }

    return sb.toString();
  }
}
