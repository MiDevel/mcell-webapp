/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// UndoSystem.js - Manages undo/redo operations for pattern states
import { settings } from './Settings.js';
import { UndoItem } from './UndoItem.js';
import { gameState } from './GameState.js';
import MclBuilder from '../utils/MclBuilder.js';
import { MclLoader } from '../utils/MclLoader.js';
import { boardState } from './BoardState.js';

export class UndoSystem {
  static readonly UNDO_EVT_USER = 'USER'; // user manually adds pattern state to undo
  static readonly UNDO_EVT_LOAD = 'LOAD'; // load pattern
  static readonly UNDO_EVT_EDIT = 'EDIT'; // edit pattern
  static readonly UNDO_EVT_CLR = 'CLR'; // clear pattern
  static readonly UNDO_EVT_RUN = 'RUN'; // run animation
  static readonly UNDO_EVT_RUN1 = 'RUN_1'; // execute "run once"
  static readonly UNDO_EVT_RUNN = 'RUN_N'; // execute "run n steps"
  static readonly UNDO_EVT_RAND = 'RAND'; // random pattern
  static readonly UNDO_EVT_SEED = 'SEED'; // apply seed
  static readonly UNDO_EVT_RULE = 'RULE'; // change family/rule
  static readonly UNDO_EVT_SIZE = 'SIZE'; // resize board
  static readonly UNDO_EVT_UNDO = 'UNDO'; // undo last action

  private items: UndoItem[] = [];
  private currentPos: number = -1;
  lastEventType: string = '';

  /**
   * Returns the number of stored undo items
   */
  public size(): number {
    return this.items.length;
  }

  /**
   * Returns the current position in the undo stack
   */
  public pos(): number {
    return this.currentPos;
  }

  /**
   * Returns the undo item at the specified position
   */
  public getItem(pos: number): UndoItem | null {
    if (pos < 0 || pos >= this.items.length) return null;
    return this.items[pos];
  }

  /**
   * Creates a new undo state from the current game state
   */
  public addItem(eventType: string): boolean {
    // console.log(`Undo add ${eventType}. State:`, { pos: this.currentPos, total: this.items.length });

    this.lastEventType = eventType;

    if (!settings.isUndoEnabled() || !settings.isUndoEventEnabled(eventType)) {
      return false;
    }

    // Remove any items newer than current position
    if (this.currentPos < this.items.length - 1) {
      // console.log('removing undo items:', this.currentPos + 1, this.items.length);
      this.items = this.items.slice(0, this.currentPos + 1);
    }

    // Build MCL pattern from current state
    const buildResult = MclBuilder.build(boardState.lattice);

    // Create new item
    const newItem: UndoItem = {
      eventType,
      timestamp: Date.now(),
      width: boardState.lattice.width,
      height: boardState.lattice.height,
      pattern: buildResult.pattern,
      numAlive: buildResult.numAlive,
      cycle: gameState.cycle,
      familyCode: gameState.currentFamilyCode,
      ruleDefinition: gameState.currentRuleDefinition,
      fileName: gameState.currentFileName,
      patternX: buildResult.x,
      patternY: buildResult.y,
    };

    // Check if the new item is the same as the previous one
    if (this.currentPos >= 0) {
      const prevItem = this.getItem(this.currentPos);
      if (
        prevItem &&
        newItem.width === prevItem.width &&
        newItem.height === prevItem.height &&
        newItem.pattern === prevItem.pattern &&
        newItem.numAlive === prevItem.numAlive &&
        newItem.cycle === prevItem.cycle &&
        newItem.familyCode === prevItem.familyCode &&
        newItem.ruleDefinition === prevItem.ruleDefinition
      ) {
        return false;
      }
    }

    // Add new item
    this.items.push(newItem);

    // Remove oldest items if we exceed the maximum
    const maxItems = settings.getMaxUndoItems();
    while (this.items.length > maxItems) {
      this.items.shift();
      this.currentPos--;
    }

    this.currentPos = this.items.length - 1;
    // console.log('Undo state added:', { pos: this.currentPos, total: this.items.length });

    return true;
  }

  /**
   * Removes the undo item at the specified position
   */
  public deleteAt(pos: number): boolean {
    if (pos < 0 || pos >= this.items.length) return false;

    // Remove the item at the specified position
    this.items.splice(pos, 1);

    // Adjust currentPos if needed
    if (pos <= this.currentPos) {
      this.currentPos = Math.max(-1, this.currentPos - 1);
    }

    return true;
  }

  /**
   * Restores the previous state if available
   */
  public undoOne(): boolean {
    if (this.currentPos < 0 || this.items.length === 0) return false;
    let pos = this.currentPos; // state to restore

    // if current pos is the newest item, add the current state as
    // the UNDO_EVT_UNDO event in order to be able to redo it
    if (pos === this.items.length - 1) {
      if (this.addItem(UndoSystem.UNDO_EVT_UNDO)) {
        pos = this.currentPos;
      }
    }

    this.currentPos = Math.max(0, pos - 1);
    return this.applyCurrentState();
  }

  /**
   * Restores the next state if available
   */
  public redoOne(): boolean {
    if (this.currentPos < 0 || this.items.length === 0) return false;
    if (this.currentPos >= this.items.length - 1) return false;

    this.currentPos = Math.min(this.items.length - 1, this.currentPos + 1);
    return this.applyCurrentState();
  }

  /**
   * Restores the state at the specified position
   */
  public restoreAt(pos: number): boolean {
    if (pos < 0 || pos >= this.items.length) return false;

    this.currentPos = pos;
    return this.applyCurrentState();
  }

  /**
   * Removes all undo items
   */
  public clearAll(): void {
    this.items = [];
    this.currentPos = -1;
  }

  /**
   * Applies the current undo state to the game
   */
  private applyCurrentState(): boolean {
    const item = this.getItem(this.currentPos);
    if (!item) return false;

    // Resize board if needed
    if (boardState.lattice.width !== item.width || boardState.lattice.height !== item.height) {
      boardState.resize(item.width, item.height);
    }

    // Load pattern from MCL string
    boardState.lattice.clear();
    MclLoader.load(boardState.lattice, item.pattern, item.patternX, item.patternY);

    // Restore other state
    gameState.cycle = item.cycle;
    gameState.activateRule(item.familyCode, item.ruleDefinition);
    gameState.currentFileName = item.fileName;

    // Repaint board
    gameState.setState({ isContentDirty: true });

    // console.log('Undo state restored:', { pos: this.currentPos, total: this.items.length });
    return true;
  }
}

// Export singleton instance
export const undoSystem = new UndoSystem();
