/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// UndoItem.js - Represents a single undo state
export interface UndoItem {
  eventType: string; // Type of event that triggered the undo state
  timestamp: number; // When the state was created
  width: number; // Board width
  height: number; // Board height
  pattern: string; // Pattern in MCL format
  numAlive: number; // Number of alive cells
  cycle: number; // Current cycle number
  familyCode: string; // CA family code
  ruleDefinition: string; // Rule definition
  fileName: string; // Current file name
  patternX: number; // Pattern left position
  patternY: number; // Pattern top position
}
