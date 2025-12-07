/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// ViewportManager.ts - Handles virtual scrolling and coordinate transforms for viewport-based rendering

import { boardState } from '../core/BoardState.js';

/**
 * Manages the viewport for canvas rendering.
 * Instead of resizing the canvas to match the board size,
 * the canvas stays fixed at the container size and we track
 * a virtual scroll offset to determine which cells are visible.
 */
export class ViewportManager {
  // Virtual scroll position (in pixels, relative to the full board)
  private _scrollX: number = 0;
  private _scrollY: number = 0;

  // Cached viewport dimensions
  private _viewportWidth: number = 0;
  private _viewportHeight: number = 0;

  constructor() {}

  /**
   * Update viewport dimensions from the container element.
   */
  updateViewportSize(width: number, height: number) {
    this._viewportWidth = width;
    this._viewportHeight = height;
  }

  get viewportWidth(): number {
    return this._viewportWidth;
  }

  get viewportHeight(): number {
    return this._viewportHeight;
  }

  get scrollX(): number {
    return this._scrollX;
  }

  get scrollY(): number {
    return this._scrollY;
  }

  /**
   * Get the full board dimensions in pixels at current cell size.
   */
  getBoardPixelWidth(): number {
    return boardState.lattice.width * boardState.cellSize;
  }

  getBoardPixelHeight(): number {
    return boardState.lattice.height * boardState.cellSize;
  }

  /**
   * Set scroll position, clamping to valid bounds.
   */
  setScroll(x: number, y: number) {
    this._scrollX = this.clampScrollX(x);
    this._scrollY = this.clampScrollY(y);
  }

  /**
   * Adjust scroll by delta, clamping to valid bounds.
   */
  pan(deltaX: number, deltaY: number) {
    this._scrollX = this.clampScrollX(this._scrollX + deltaX);
    this._scrollY = this.clampScrollY(this._scrollY + deltaY);
  }

  /**
   * Clamp scroll X to valid range.
   */
  private clampScrollX(x: number): number {
    const maxScrollX = Math.max(0, this.getBoardPixelWidth() - this._viewportWidth);
    return Math.max(0, Math.min(maxScrollX, x));
  }

  /**
   * Clamp scroll Y to valid range.
   */
  private clampScrollY(y: number): number {
    const maxScrollY = Math.max(0, this.getBoardPixelHeight() - this._viewportHeight);
    return Math.max(0, Math.min(maxScrollY, y));
  }

  /**
   * Re-clamp current scroll position (call after zoom or resize).
   */
  reclampScroll() {
    this._scrollX = this.clampScrollX(this._scrollX);
    this._scrollY = this.clampScrollY(this._scrollY);
  }

  /**
   * Get the range of visible cells (inclusive start, exclusive end).
   */
  getVisibleCellRange(): {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
  } {
    const cellSize = boardState.cellSize;
    const numCols = boardState.lattice.width;
    const numRows = boardState.lattice.height;

    const startCol = Math.floor(this._scrollX / cellSize);
    const startRow = Math.floor(this._scrollY / cellSize);
    const endCol = Math.min(numCols, Math.ceil((this._scrollX + this._viewportWidth) / cellSize));
    const endRow = Math.min(numRows, Math.ceil((this._scrollY + this._viewportHeight) / cellSize));

    return { startCol, startRow, endCol, endRow };
  }

  /**
   * Convert screen (canvas) coordinates to board cell coordinates.
   */
  screenToCell(screenX: number, screenY: number): { col: number; row: number } {
    const cellSize = boardState.cellSize;
    const col = Math.floor((screenX + this._scrollX) / cellSize);
    const row = Math.floor((screenY + this._scrollY) / cellSize);
    return { col, row };
  }

  /**
   * Convert board cell coordinates to screen (canvas) pixel coordinates.
   * Returns the top-left corner of the cell on screen.
   */
  cellToScreen(col: number, row: number): { x: number; y: number } {
    const cellSize = boardState.cellSize;
    const x = col * cellSize - this._scrollX;
    const y = row * cellSize - this._scrollY;
    return { x, y };
  }

  /**
   * Convert board pixel coordinates to screen pixel coordinates.
   */
  boardToScreen(boardX: number, boardY: number): { x: number; y: number } {
    return {
      x: boardX - this._scrollX,
      y: boardY - this._scrollY,
    };
  }

  /**
   * Convert screen pixel coordinates to board pixel coordinates.
   */
  screenToBoard(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this._scrollX,
      y: screenY + this._scrollY,
    };
  }

  /**
   * Center the viewport on a specific cell.
   */
  centerOnCell(col: number, row: number) {
    const cellSize = boardState.cellSize;
    const targetX = col * cellSize + cellSize / 2 - this._viewportWidth / 2;
    const targetY = row * cellSize + cellSize / 2 - this._viewportHeight / 2;
    this.setScroll(targetX, targetY);
  }

  /**
   * Center the viewport on the board center.
   */
  centerOnBoard() {
    const centerCol = Math.floor(boardState.lattice.width / 2);
    const centerRow = Math.floor(boardState.lattice.height / 2);
    this.centerOnCell(centerCol, centerRow);
  }

  /**
   * Adjust scroll to maintain a point's screen position after zoom.
   * Call this before changing cellSize, passing the cell coordinates
   * that should stay fixed on screen.
   */
  adjustScrollForZoom(
    anchorCol: number,
    anchorRow: number,
    anchorScreenX: number,
    anchorScreenY: number,
    newCellSize: number
  ) {
    // After zoom, the anchor cell should still appear at the same screen position
    const newBoardX = anchorCol * newCellSize;
    const newBoardY = anchorRow * newCellSize;
    this._scrollX = newBoardX - anchorScreenX;
    this._scrollY = newBoardY - anchorScreenY;
    // Will be clamped on next reclampScroll() call after cellSize is updated
  }

  /**
   * Check if a cell is visible in the viewport.
   */
  isCellVisible(col: number, row: number): boolean {
    const { startCol, startRow, endCol, endRow } = this.getVisibleCellRange();
    return col >= startCol && col < endCol && row >= startRow && row < endRow;
  }

  /**
   * Check if a rectangle (in cell coordinates) intersects the viewport.
   */
  isRectVisible(left: number, top: number, width: number, height: number): boolean {
    const { startCol, startRow, endCol, endRow } = this.getVisibleCellRange();
    return left < endCol && left + width > startCol && top < endRow && top + height > startRow;
  }
}

export const viewportManager = new ViewportManager();
