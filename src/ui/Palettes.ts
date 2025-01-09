/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Palettes.js
export class Palette {
  name: string;
  colors: string[];
  gridLineColors: string[];

  constructor(name: string, gridLineColor1: string, gridLineColor2: string) {
    this.name = name;
    this.colors = ['#000000', '#FF0000', '#00FF00', '#0000FF'];
    this.gridLineColors = [gridLineColor1, gridLineColor2];
  }

  updateColors(numOfStates: number) {
    if (this.name === 'MCell') {
      let colorPalette = generateGradient('#FFFF00', '#FF0000', numOfStates - 1);
      colorPalette.unshift('#000000'); // black for state 0
      this.colors = colorPalette;
    } else if (this.name === '8 colors') {
      const baseColors = [
        '#FF0000',
        '#0000FF',
        '#FFFF00',
        '#008000',
        '#C0C0C0',
        '#FF8000',
        '#00FFFF',
        '#00FF00',
        '#9D0000',
      ];
      let colorPalette = [];
      for (let i = 0; i < numOfStates - 1; i++) {
        colorPalette.push(baseColors[i % baseColors.length]);
      }
      colorPalette.unshift('#000000'); // black for state 0
      this.colors = colorPalette;
    } else if (this.name === 'Red & Blue') {
      let colorPalette = generateGradient('#FF0000', '#0000FF', numOfStates - 1);
      colorPalette.unshift('#FFFFFF'); // white for state 0
      this.colors = colorPalette;
    } else if (this.name === 'Dolphin') {
      let colorPalette = generateGradient('#0000FF', '#00FFFF', numOfStates - 1);
      colorPalette.unshift('#FFFFFF'); // white for state 0
      this.colors = colorPalette;
    } else if (this.name === 'Milky Way') {
      let colorPalette = generateGradient('#FFFFFF', '#1010FF', numOfStates - 1);
      colorPalette.unshift('#000050');
      this.colors = colorPalette;
    } else if (this.name === 'Pastel') {
      const baseColors = [
        '#FFA07A',
        '#98FB98',
        '#87CEFA',
        '#DDA0DD',
        '#F0E68C',
        '#FF6347',
        '#4682B4',
        '#8B4513',
      ];
      let colorPalette = [];
      for (let i = 0; i < numOfStates - 1; i++) {
        colorPalette.push(baseColors[i % baseColors.length]);
      }
      colorPalette.unshift('#FFFFFF'); // white for state 0
      this.colors = colorPalette;
    }
  }
}

export class Palettes {
  list: Palette[] = [];
  constructor() {
    this.list = [
      new Palette('MCell', '#330000', '#660000'),
      new Palette('8 colors', '#330000', '#660000'),
      new Palette('Red & Blue', '#D0D0D0', '#A0A0A0'),
      new Palette('Dolphin', '#D0D0D0', '#A0A0A0'),
      new Palette('Milky Way', '#000080', '#0000A0'),
      new Palette('Pastel', '#CCC', '#AAA'),
    ];
  }

  getPalette(name: string): Palette {
    let palette = this.list.find((palette) => palette.name === name);
    if (!palette) {
      palette = this.list.find(
        (palette) => name.startsWith(palette.name) || palette.name.startsWith(name)
      );
    }
    return palette ? palette : this.list[0];
  }

  // Update the colors in each palette to match the number of states (max cell age + 1)
  updateColors(numOfStates: number) {
    this.list.forEach((palette) => {
      if (palette.name === 'MCell') {
        let colorPalette = generateGradient('#FFFF00', '#FF0000', numOfStates - 1);
        colorPalette.unshift('#000000'); // black for state 0
        palette.colors = colorPalette;
      } else if (palette.name === '8 colors') {
        const baseColors = [
          '#FF0000',
          '#0000FF',
          '#FFFF00',
          '#008000',
          '#C0C0C0',
          '#FF8000',
          '#00FFFF',
          '#00FF00',
          '#9D0000',
        ];
        let colorPalette = [];
        for (let i = 0; i < numOfStates - 1; i++) {
          colorPalette.push(baseColors[i % baseColors.length]);
        }
        colorPalette.unshift('#000000'); // black for state 0
        palette.colors = colorPalette;
      } else if (palette.name === 'Red & Blue') {
        let colorPalette = generateGradient('#FF0000', '#0000FF', numOfStates - 1);
        colorPalette.unshift('#FFFFFF'); // white for state 0
        palette.colors = colorPalette;
      } else if (palette.name === 'Dolphin') {
        let colorPalette = generateGradient('#0000FF', '#00FFFF', numOfStates - 1);
        colorPalette.unshift('#FFFFFF'); // white for state 0
        palette.colors = colorPalette;
      } else if (palette.name === 'Milky Way') {
        let colorPalette = generateGradient('#FFFFFF', '#1010FF', numOfStates - 1);
        colorPalette.unshift('#000050');
        palette.colors = colorPalette;
      } else if (palette.name === 'Pastel') {
        const baseColors = [
          '#FFA07A',
          '#98FB98',
          '#87CEFA',
          '#DDA0DD',
          '#F0E68C',
          '#FF6347',
          '#4682B4',
          '#8B4513',
        ];
        let colorPalette = [];
        for (let i = 0; i < numOfStates - 1; i++) {
          colorPalette.push(baseColors[i % baseColors.length]);
        }
        colorPalette.unshift('#FFFFFF'); // white for state 0
        palette.colors = colorPalette;
      }
    });
  }
}

// Generates a gradient of colors between two hex colors.
// color1 and color2 are hex colors.
// numOfColors is the number of colors to generate.
// Returns an array of hex colors.
function generateGradient(color1: string, color2: string, numOfColors: number) {
  // #8020ff => {r: 128, g: 32, b: 255}
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : {
          r: 0xff,
          g: 0,
          b: 0,
        };
  }

  // (128, 32, 256) => #8020ff
  function rgbToHex(r: number, g: number, b: number) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const dr = (c2.r - c1.r) / numOfColors;
  const dg = (c2.g - c1.g) / numOfColors;
  const db = (c2.b - c1.b) / numOfColors;

  const palette = [];

  for (let i = 0; i < numOfColors; i++) {
    if (i === numOfColors - 1 && numOfColors > 1) {
      palette.push(rgbToHex(c2.r, c2.g, c2.b));
    } else {
      const r = Math.round(c1.r + i * dr);
      const g = Math.round(c1.g + i * dg);
      const b = Math.round(c1.b + i * db);
      palette.push(rgbToHex(r, g, b));
    }
  }

  return palette;
}

export const palettes = new Palettes();
