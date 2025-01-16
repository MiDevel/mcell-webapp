/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// RunNumDialog.js - Dialog for controlled pattern running
import { dialog, TDialog } from './Dialog.js';
import { boardState } from '../core/BoardState.js';
import { gameState } from '../core/GameState.js';
import { CaEngines } from '../core/CaEngines.js';
import { controls } from '../ui/Controls.js';
import { board } from '../ui/Board.js';
import { undoSystem, UndoSystem } from '../core/UndoSystem.js';

export class RunNumDialog {
  dialog: TDialog;
  private isRunning: boolean = false;
  private redrawEvery: number = 50;
  private cyclesLeft: number = 0;
  private cycleNumber: number = 0;
  private mode: 'cycles' | 'target' | 'continuous' | 'page' = 'cycles';
  private animationId: number | null = null;

  constructor() {
    this.dialog = dialog;
  }

  createDialogContent(): string {
    return `
            <div class="run-num-settings">
              <div class="settings-group-frame">
                <div class="radio-group">
                  <label>
                    <input type="radio" name="runMode" value="cycles" checked>
                    Run for <input type="number" id="numCycles" value="20" min="1" max="1000000"> cycles
                  </label>
                  <label>
                    <input type="radio" name="runMode" value="target">
                    Run up to cycle <input type="number" id="targetCycle" value="1000" min="1" max="10000000">
                  </label>
                  <label>
                    <input type="radio" name="runMode" value="continuous">
                    Run continuously
                  </label>
                  <label>
                    <input type="radio" name="runMode" value="page">
                    Run one page (useful in 1-D rules)
                  </label>
                </div>
              </div>
              <div class="settings-group-frame">
                <div class="setting-group">
                  <label>Redraw every cycles:</label>
                  <input type="number" id="redrawCycles" value="${this.redrawEvery}" min="1" max="1000">
                </div>
                <div class="quick-redraw-btns">
                  <button data-cycles="1">1</button>
                  <button data-cycles="5">5</button>
                  <button data-cycles="10">10</button>
                  <button data-cycles="20">20</button>
                  <button data-cycles="50">50</button>
                  <button data-cycles="100">100</button>
                  <button data-cycles="200">200</button>
                  <button data-cycles="500">500</button>
                  <button data-cycles="1000">1000</button>
                  <button data-cycles="2000">2000</button>
                  <button data-cycles="5000">5000</button>
                </div>
              </div>
            </div>
            <div class="dialog-buttons">
              <button id="runBtn" class="primary">Run</button>
              <button id="stopBtn" disabled>Stop</button>
              <button id="closeBtn">Close</button>
            </div>
        `;
  }

  private runCycle() {
    if (!this.isRunning) return;

    const startTime = performance.now();

    do {
      // Check if we should stop
      if (this.cyclesLeft === 0) {
        this.stop();
        return;
      }

      // Run one cycle
      this.cycleNumber++;
      controls.runOneSilentCycle();
      this.cyclesLeft--;

      // Only redraw if needed
      if (this.cycleNumber % this.redrawEvery === 0) {
        board.drawBoard();
        controls.refreshStatusLine();
      }
    } while (performance.now() - startTime < 200);

    // Schedule next cycle
    this.animationId = requestAnimationFrame(() => this.runCycle());
  }

  private start() {
    const runModeEl = this.dialog.activeDialog?.querySelector(
      'input[name="runMode"]:checked'
    ) as HTMLInputElement;
    const numCyclesEl = this.dialog.activeDialog?.querySelector('#numCycles') as HTMLInputElement;
    const targetCycleEl = this.dialog.activeDialog?.querySelector(
      '#targetCycle'
    ) as HTMLInputElement;
    const redrawCyclesEl = this.dialog.activeDialog?.querySelector(
      '#redrawCycles'
    ) as HTMLInputElement;

    this.mode = runModeEl.value as typeof this.mode;
    this.redrawEvery = parseInt(redrawCyclesEl.value);

    if (this.mode === 'cycles') {
      this.cyclesLeft = parseInt(numCyclesEl.value);
    } else if (this.mode === 'target') {
      let targetCycle = parseInt(targetCycleEl.value);
      this.cyclesLeft = targetCycle - gameState.cycle;
    } else if (this.mode === 'continuous') {
      this.cyclesLeft = -1;
    } else if (this.mode === 'page') {
      if (gameState.currentEngine.universeType === CaEngines.UNIV_TYPE_1D) {
        this.cyclesLeft = boardState.lattice.height - gameState.last1DRow - 1;
        if (this.cyclesLeft <= 0) {
          this.cyclesLeft = boardState.lattice.height;
        }
      } else {
        this.cyclesLeft = boardState.lattice.height;
      }
    }

    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_CLR);

    this.isRunning = true;
    gameState.allowRedraw = false;
    this.cycleNumber = 0;
    this.updateButtons(true);
    this.runCycle();
  }

  private stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.updateButtons(false);
    board.drawBoard();
    controls.refreshStatusLine();
    gameState.allowRedraw = true;
  }

  private updateButtons(running: boolean) {
    const runBtn = this.dialog.activeDialog?.querySelector('#runBtn') as HTMLButtonElement;
    const stopBtn = this.dialog.activeDialog?.querySelector('#stopBtn') as HTMLButtonElement;

    if (runBtn) runBtn.disabled = running;
    if (stopBtn) stopBtn.disabled = !running;
  }

  show() {
    this.dialog.show('Run Pattern', this.createDialogContent());

    // Add event listeners
    const runBtn = this.dialog.activeDialog?.querySelector('#runBtn');
    const stopBtn = this.dialog.activeDialog?.querySelector('#stopBtn');
    const closeBtn = this.dialog.activeDialog?.querySelector('#closeBtn');
    const quickRedrawBtns = this.dialog.activeDialog?.querySelectorAll('.quick-redraw-btns button');

    runBtn?.addEventListener('click', () => this.start());
    stopBtn?.addEventListener('click', () => this.stop());
    closeBtn?.addEventListener('click', () => {
      this.stop();
      gameState.allowRedraw = true;
      this.dialog.close();
    });

    quickRedrawBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cycles = parseInt((e.target as HTMLButtonElement).dataset.cycles || '50');
        const input = this.dialog.activeDialog?.querySelector('#redrawCycles') as HTMLInputElement;
        if (input) input.value = cycles.toString();
      });
    });

    gameState.setState({ isRunning: false });
  }
}

export const runNumDialog = new RunNumDialog();
