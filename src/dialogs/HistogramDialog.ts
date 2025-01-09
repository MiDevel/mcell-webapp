/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// HistogramDialog.js - State distribution dialog UI
import { dialog } from './Dialog.js';
import { board } from '../ui/Board.js';
import { boardState } from '../core/BoardState.js';
import { palettes, Palette } from '../ui/Palettes.js';
import { settings } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';

export class HistogramDialog {
  private dialog: typeof dialog;
  private showState0: boolean = false;
  private data: { state: number; count: number; percentage: number }[] = [];

  constructor() {
    this.dialog = dialog;

    // Add event listener to handle checkbox changes using event delegation
    this.dialog.activeDialog?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'showState0') {
        this.showState0 = target.checked;
        this.dialog.setContent(this.renderContent());
        this.drawChart();
      }
    });
  }

  private updateData() {
    const numStates = gameState.currentEngine.numStates;
    const totalCells = boardState.lattice.width * boardState.lattice.height;
    this.data = [];

    // Count cells in each state
    for (let state = 0; state < numStates; state++) {
      let count = 0;
      for (let y = 0; y < boardState.lattice.height; y++) {
        for (let x = 0; x < boardState.lattice.width; x++) {
          if (boardState.lattice.getCell(x, y) === state) {
            count++;
          }
        }
      }
      const percentage = (count / totalCells) * 100;
      this.data.push({ state, count, percentage });
    }
  }

  private renderContent(): string {
    this.updateData();
    const content: string[] = [];

    // Add table
    content.push('<div class="histogram-table-container">');
    content.push('<table class="histogram-table">');
    content.push('<thead><tr><th>State</th><th>Count</th><th>Percentage</th></tr></thead>');
    content.push('<tbody>');

    // Always show all states in the table
    this.data.forEach(({ state, count, percentage }) => {
      content.push(`<tr>`);
      content.push(`<td>${state}</td>`);
      content.push(`<td>${count}</td>`);
      content.push(`<td>${percentage.toFixed(2)}%</td>`);
      content.push(`</tr>`);
    });

    content.push('</tbody></table>');
    content.push('</div>');

    // Add canvas for chart
    content.push('<canvas id="histogram-chart" width="300" height="200"></canvas>');

    // Add checkbox for state 0
    content.push('<div class="histogram-controls">');
    content.push(
      `<label><input type="checkbox" id="showState0" ${this.showState0 ? 'checked' : ''}> Show state 0</label>`
    );
    content.push('</div>');

    return content.join('');
  }

  private drawChart() {
    const canvas = document.getElementById('histogram-chart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const currentPalette: Palette = palettes.getPalette(settings.getPaletteName());

    // Clear canvas
    ctx.fillStyle = currentPalette.colors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Filter data based on checkbox
    const displayData = this.showState0 ? this.data : this.data.filter((d) => d.state !== 0);

    // Find max percentage for scaling
    const maxPercentage = Math.max(...displayData.map((d) => d.percentage));

    // Draw bars
    const barWidth = canvas.width / (displayData.length + 1);
    const padding = barWidth * 0.1;

    displayData.forEach((d, i) => {
      const barHeight = (d.percentage / maxPercentage) * (canvas.height - 40);
      const x = i * barWidth + padding;
      const y = canvas.height - barHeight - 20;

      // Draw bar
      if (d.state === 0) {
        // For state 0, draw only the outline using state 1's color
        ctx.strokeStyle = currentPalette.colors[1];
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth - padding * 2, barHeight);
      } else {
        ctx.fillStyle = currentPalette.colors[d.state];
        ctx.fillRect(x, y, barWidth - padding * 2, barHeight);
      }

      // Draw state number
      ctx.fillStyle = currentPalette.colors[d.state];
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(d.state.toString(), x + barWidth / 2 - padding, canvas.height - 5);
    });
  }

  show() {
    this.dialog.show('State Distribution', this.renderContent());

    // Update chart on game state change
    this.drawChart();
  }
}

// Export singleton instance
export const histogramDialog = new HistogramDialog();
