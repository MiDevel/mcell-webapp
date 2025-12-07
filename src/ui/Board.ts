/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Board.js - Handles board UI and drawing
import { boardState } from '../core/BoardState.js';
import { gameState, GameState } from '../core/GameState.js';
import { palettes, Palette } from './Palettes.js';
import { Constants } from '../utils/Constants.js';
import { settings } from '../core/Settings.js';
import { paintTools } from './PaintTools.js';
import { controls } from './Controls.js';
import { viewportManager } from './ViewportManager.js';

export interface TBoard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isPanning: boolean;
  lastPanX: number;
  lastPanY: number;
  initialScrollX: number;
  initialScrollY: number;
  isPainting: boolean;
  lastPaintX: number;
  lastPaintY: number;
  numBoardDraws: number;
  selectionStartX: number;
  selectionStartY: number;
  isSelecting: boolean;
}

export class Board {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isPanning: boolean;
  lastPanX: number;
  lastPanY: number;
  initialScrollX: number;
  initialScrollY: number;
  isPainting: boolean;
  lastPaintX: number;
  lastPaintY: number;
  numBoardDraws: number;
  selectionStartX: number;
  selectionStartY: number;
  isSelecting: boolean;

  private lastPalette: string = '';
  private dynaDrawColors: string[] = [];
  private lastTouchDistance: number = 0;
  private isPinching: boolean = false;
  private pinchCenterX: number | null = null;
  private pinchCenterY: number | null = null;

  constructor(canvasId = 'board-canvas') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.initialScrollX = 0;
    this.initialScrollY = 0;
    this.isPainting = false;
    this.lastPaintX = -1;
    this.lastPaintY = -1;
    this.numBoardDraws = 0;
    this.selectionStartX = -1;
    this.selectionStartY = -1;
    this.isSelecting = false;

    this.initializeCanvas();
    this.updateCursor();
    this.initializeEventListeners();
    gameState.subscribe(this.onGameStateChange.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Handle window resize - reinitialize canvas when viewport size changes
    window.addEventListener('resize', this.handleWindowResize.bind(this));

    // Center the board initially
    viewportManager.centerOnBoard();

    this.drawBoard(); // Initial draw
  }

  /**
   * Handle window resize by reinitializing the canvas.
   */
  private handleWindowResize() {
    this.initializeCanvas();
    this.drawBoard();
  }

  initializeCanvas() {
    // Get container
    const container: HTMLElement | null = this.canvas.parentElement;
    if (!container) {
      throw new Error('Board container not found.');
    }

    // Set canvas to fill container (viewport-based rendering)
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Only resize canvas if dimensions changed (avoid expensive operation)
    if (this.canvas.width !== viewportWidth || this.canvas.height !== viewportHeight) {
      this.canvas.width = viewportWidth;
      this.canvas.height = viewportHeight;
    }

    // Update viewport manager with current dimensions
    viewportManager.updateViewportSize(viewportWidth, viewportHeight);

    // Set canvas styles - canvas fills the container
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.width = `${viewportWidth}px`;
    this.canvas.style.height = `${viewportHeight}px`;

    // Container doesn't need to scroll anymore - we handle virtual scrolling
    container.style.overflow = 'hidden';

    // Reclamp scroll position in case board shrunk
    viewportManager.reclampScroll();
  }

  initializeEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

    // Touch events
    this.canvas.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: 1,
          bubbles: true,
        });
        // Add offset properties to the event
        Object.defineProperties(mouseEvent, {
          offsetX: { value: offsetX },
          offsetY: { value: offsetY },
        });
        this.handleMouseDown(mouseEvent);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: 1,
          bubbles: true,
        });
        // Add offset properties to the event
        Object.defineProperties(mouseEvent, {
          offsetX: { value: offsetX },
          offsetY: { value: offsetY },
        });
        this.handleMouseMove(mouseEvent);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        // Get the last known touch position since touches array will be empty
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = this.lastPaintX * boardState.cellSize;
        const offsetY = this.lastPaintY * boardState.cellSize;

        const mouseEvent = new MouseEvent('mouseup', {
          clientX: rect.left + offsetX,
          clientY: rect.top + offsetY,
          buttons: 0,
          bubbles: true,
        });
        // Add offset properties to the event
        Object.defineProperties(mouseEvent, {
          offsetX: { value: offsetX },
          offsetY: { value: offsetY },
        });

        // If we were selecting, finalize the selection
        if (this.isSelecting) {
          const left = Math.min(this.selectionStartX, this.lastPaintX);
          const top = Math.min(this.selectionStartY, this.lastPaintY);
          const right = Math.max(this.selectionStartX, this.lastPaintX);
          const bottom = Math.max(this.selectionStartY, this.lastPaintY);

          const width = right - left + 1;
          const height = bottom - top + 1;
          if (width > 1 && height > 1) {
            boardState.createSelection(left, top, width, height);
          }
          this.isSelecting = false;
        }

        this.handleMouseUp(mouseEvent);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'touchcancel',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const mouseEvent = new MouseEvent('mouseleave', {});
        this.handleMouseLeave(mouseEvent);
      },
      { passive: false }
    );
  }

  onGameStateChange(state: GameState) {
    if (
      state.isPaletteChanged ||
      this.lastPalette === '' ||
      this.lastPalette !== settings.getPaletteName()
    ) {
      // console.log(`Board onGameStateChange. New palette: ${settings.getPaletteName()}. Changed: ${state.isPaletteChanged}`);
      // Initialize/update dynamic drawing colors
      const currentPalette = palettes.getPalette(settings.getPaletteName());
      this.dynaDrawColors = currentPalette.colors.map((color) =>
        this.adjustColorBrightness(color, 0.7)
      );
      this.lastPalette = settings.getPaletteName();
    }

    if (state.isCursorDirty) {
      state.isCursorDirty = false;
      this.updateCursor();
    }
    if (state.isGeometryDirty) {
      state.isGeometryDirty = false;
      this.initializeCanvas();
    }
    if (state.isContentDirty) {
      state.isContentDirty = false;
      if (state.allowRedraw) {
        this.drawBoard();
      }
    }
  }

  updateCursor() {
    if (gameState.interactMode === 'pan') {
      this.canvas.style.cursor = this.isPanning ? 'grabbing' : 'grab';
      return;
    }

    if (gameState.interactMode === 'paint') {
      const currentTool = paintTools.getActiveTool();

      if (currentTool === 'select') {
        if (boardState.selectionActive && boardState.selectionLattice) {
          // Check if mouse is inside selection
          const x = this.lastPaintX;
          const y = this.lastPaintY;

          if (
            x >= boardState.selectionLattice.left &&
            x < boardState.selectionLattice.left + boardState.selectionLattice.width &&
            y >= boardState.selectionLattice.top &&
            y < boardState.selectionLattice.top + boardState.selectionLattice.height
          ) {
            this.canvas.style.cursor = 'move';
            return;
          }
        }
        this.canvas.style.cursor = 'crosshair';
        return;
      }

      this.canvas.style.cursor = 'default';
    }
  }

  getCellCoordinates(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // Convert screen coordinates to cell coordinates using viewport manager
    const { col, row } = viewportManager.screenToCell(screenX, screenY);
    return { x: col, y: row };
  }

  /**
   * Convert mouse event offset coordinates to cell coordinates.
   * offsetX/offsetY are relative to the canvas element.
   */
  getOffsetCellCoordinates(offsetX: number, offsetY: number) {
    const { col, row } = viewportManager.screenToCell(offsetX, offsetY);
    return { x: col, y: row };
  }

  isValidCell(x: number, y: number) {
    return x >= 0 && x < boardState.lattice.width && y >= 0 && y < boardState.lattice.height;
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (boardState.selectionActive) {
        boardState.applySelection();
        this.drawBoard();
      }
      if (this.isSelecting) {
        this.isSelecting = false;
        this.drawBoard();
      }
    }
  }

  handleMouseDown(event: MouseEvent) {
    // Convert screen coordinates to cell coordinates using viewport
    const { x: cellX, y: cellY } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);

    if (gameState.interactMode === 'pan') {
      this.isPanning = true;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      // Store initial virtual scroll position
      this.initialScrollX = viewportManager.scrollX;
      this.initialScrollY = viewportManager.scrollY;
      this.canvas.style.cursor = 'grabbing';
    } else if (gameState.interactMode === 'paint') {
      const currentTool = paintTools.getActiveTool();

      if (currentTool === 'select') {
        const { x, y } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);

        if (boardState.selectionActive && boardState.selectionLattice) {
          // Check if click is inside selection
          if (
            x >= boardState.selectionLattice.left &&
            x < boardState.selectionLattice.left + boardState.selectionLattice.width &&
            y >= boardState.selectionLattice.top &&
            y < boardState.selectionLattice.top + boardState.selectionLattice.height
          ) {
            this.isPainting = true; // Use painting state for dragging
            this.lastPaintX = x;
            this.lastPaintY = y;
            return;
          } else {
            // Click outside selection - apply it first
            boardState.applySelection();
          }
        }

        // Start new selection
        this.isSelecting = true;
        this.selectionStartX = x;
        this.selectionStartY = y;
        this.lastPaintX = x;
        this.lastPaintY = y;
      } else if (paintTools.isPaintingTool(currentTool)) {
        // If switching to a painting tool while selection is active, apply it first
        if (boardState.selectionActive) {
          boardState.applySelection();
        }
        this.isPainting = true;
        paintTools.startDraw(cellX, cellY, event);
        this.lastPaintX = cellX;
        this.lastPaintY = cellY;
      } else if (paintTools.isSelectionTool(currentTool)) {
        // Handle other selection tools (copy, paste, etc.) - will be implemented later
        this.isPainting = true;
        this.lastPaintX = cellX;
        this.lastPaintY = cellY;
      }
    }
  }

  handleMouseMove(event: MouseEvent) {
    // Always update mouse position for cursor updates using viewport coordinates
    const { x, y } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);
    const state = this.isValidCell(x, y) ? boardState.lattice.getCell(x, y) : -1;
    paintTools.updateStatusPanel(x, y, state);

    if (!this.isPanning && !this.isPainting && !this.isSelecting) {
      this.lastPaintX = x;
      this.lastPaintY = y;
      this.updateCursor();
      return;
    }

    if (this.isPanning) {
      const dx = event.clientX - this.lastPanX;
      const dy = event.clientY - this.lastPanY;

      // Use virtual scrolling via viewport manager
      viewportManager.setScroll(this.initialScrollX - dx, this.initialScrollY - dy);
      this.drawBoard();
    } else if (
      this.isPainting &&
      paintTools.getActiveTool() === 'select' &&
      boardState.selectionActive
    ) {
      if (x !== this.lastPaintX || y !== this.lastPaintY) {
        const dx = x - this.lastPaintX;
        const dy = y - this.lastPaintY;

        if (boardState.selectionLattice) {
          boardState.moveSelection(
            boardState.selectionLattice.left + dx,
            boardState.selectionLattice.top + dy
          );
        }

        this.lastPaintX = x;
        this.lastPaintY = y;
        this.drawBoard();
      }
    } else if (this.isSelecting) {
      if (x !== this.lastPaintX || y !== this.lastPaintY) {
        this.lastPaintX = x;
        this.lastPaintY = y;
        this.drawBoard(); // This will draw the dynamic selection rectangle
      }
    } else if (this.isPainting) {
      // Convert to cell coordinates using viewport
      const { x: cellX, y: cellY } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);
      paintTools.continueDraw(cellX, cellY, event);
      this.lastPaintX = cellX;
      this.lastPaintY = cellY;
    }

    this.updateCursor();
  }

  // Mouse wheel zoom - uses viewport coordinates
  handleWheel(event: WheelEvent) {
    event.preventDefault();

    // Calculate cell coordinates under mouse using viewport
    const { x, y } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);

    // Pass screen position for zoom anchoring
    if (event.deltaY < 0) {
      controls.adjustCellSize(1, x, y, event.offsetX, event.offsetY);
    } else {
      controls.adjustCellSize(-1, x, y, event.offsetX, event.offsetY);
    }
  }

  handleMouseUp(event: MouseEvent) {
    if (this.isPainting && paintTools.getActiveTool() === 'select' && boardState.selectionActive) {
      const { x, y } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);

      if (x !== this.lastPaintX || y !== this.lastPaintY) {
        const dx = x - this.lastPaintX;
        const dy = y - this.lastPaintY;

        if (boardState.selectionLattice) {
          boardState.moveSelection(
            boardState.selectionLattice.left + dx,
            boardState.selectionLattice.top + dy
          );
        }
      }
    } else if (this.isSelecting) {
      const { x, y } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);

      const left = Math.min(this.selectionStartX, x);
      const top = Math.min(this.selectionStartY, y);
      const width = Math.abs(x - this.selectionStartX) + 1;
      const height = Math.abs(y - this.selectionStartY) + 1;

      if (width > 1 && height > 1) {
        boardState.createSelection(left, top, width, height);
      }

      this.isSelecting = false;
      this.selectionStartX = -1;
      this.selectionStartY = -1;
    } else if (this.isPainting) {
      const { x: cellX, y: cellY } = this.getOffsetCellCoordinates(event.offsetX, event.offsetY);
      paintTools.endDraw(cellX, cellY, event);
    }

    this.isPanning = false;
    this.isPainting = false;
    this.drawBoard();
  }

  handleMouseLeave(event: MouseEvent) {
    paintTools.updateStatusPanel(-1, -1, -1);
  }

  checkIfToDrawGrid() {
    return gameState.showGrid && boardState.cellSize >= Constants.MIN_GRID_CELL_SIZE;
  }

  // Draw only the visible portion of the board (viewport-based rendering)
  drawBoard() {
    // console.log(`Board draw ${this.numBoardDraws}`);
    this.numBoardDraws = this.numBoardDraws ? this.numBoardDraws + 1 : 1;

    const cellSize = boardState.cellSize;
    const cellDisplaySize = this.checkIfToDrawGrid()
      ? cellSize - 1
      : boardState.cellSize >= Constants.MIN_GRID_CELL_SIZE
        ? cellSize - 1
        : cellSize;
    const currentPalette: Palette = palettes.getPalette(settings.getPaletteName());

    // Get visible cell range from viewport manager
    const { startCol, startRow, endCol, endRow } = viewportManager.getVisibleCellRange();

    // Calculate screen bounds of the board
    const boardWidth = boardState.lattice.width;
    const boardHeight = boardState.lattice.height;
    const { x: boardScreenLeft, y: boardScreenTop } = viewportManager.cellToScreen(0, 0);
    const { x: boardScreenRight, y: boardScreenBottom } = viewportManager.cellToScreen(boardWidth, boardHeight);

    // Fill the entire canvas with a contrasting "outside board" color
    const bgColor = currentPalette.colors[0];
    this.ctx.fillStyle = this.getOutsideBoardColor(bgColor);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill the board area with the actual background color
    const boardScreenWidth = boardScreenRight - boardScreenLeft;
    const boardScreenHeight = boardScreenBottom - boardScreenTop;
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(boardScreenLeft, boardScreenTop, boardScreenWidth, boardScreenHeight);

    // Draw a visible border around the board (1px)
    this.ctx.strokeStyle = this.getBoardBorderColor(bgColor);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boardScreenLeft - 0.5, boardScreenTop - 0.5, boardScreenWidth + 1, boardScreenHeight + 1);

    // Draw grid lines (only visible portion, clipped to board bounds)
    if (this.checkIfToDrawGrid()) {
      this.drawGridLines(startCol, startRow, endCol, endRow, cellSize, currentPalette.gridLineColors, boardWidth, boardHeight);
    }

    // Draw only visible cells
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const state = boardState.lattice.getCell(col, row);
        if (state > 0) {
          // Convert cell position to screen position
          const { x: screenX, y: screenY } = viewportManager.cellToScreen(col, row);
          this.ctx.fillStyle = currentPalette.colors[state % currentPalette.colors.length];
          this.ctx.fillRect(screenX, screenY, cellDisplaySize, cellDisplaySize);
        }
      }
    }

    // Draw dynamic drawing overlay if active (only visible portion)
    if (boardState.dynaDrawActive && boardState.dynaDrawLattice) {
      let lastDynaDrawState = -9999;
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const state = boardState.dynaDrawLattice.getCell(col, row);
          // Draw both positive states (normal cells) and -1 (erasing)
          if (state !== 0) {
            if (lastDynaDrawState !== state) {
              // For erasing (state -1), use state 0's color
              const colorState = state === -1 ? 0 : state;
              this.ctx.fillStyle = this.dynaDrawColors[colorState % currentPalette.colors.length];
              lastDynaDrawState = state;
            }
            const { x: screenX, y: screenY } = viewportManager.cellToScreen(col, row);
            this.ctx.fillRect(screenX, screenY, cellDisplaySize, cellDisplaySize);
          }
        }
      }
    }

    // Draw selection (clipped to viewport)
    this.drawSelection(cellDisplaySize);
  }

  // Helper to parse color string to RGB
  private parseColor(color: string): { r: number; g: number; b: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    const rgbColor = ctx.fillStyle;
    return {
      r: parseInt(rgbColor.slice(1, 3), 16),
      g: parseInt(rgbColor.slice(3, 5), 16),
      b: parseInt(rgbColor.slice(5, 7), 16),
    };
  }

  // Helper to convert RGB to hex
  private rgbToHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
  }

  // Get a contrasting "outside board" color
  // For dark backgrounds: lighten slightly
  // For light backgrounds: darken slightly
  private getOutsideBoardColor(bgColor: string): string {
    const { r, g, b } = this.parseColor(bgColor);
    const brightness = (r + g + b) / 3;

    if (brightness < 128) {
      // Dark background - lighten by adding a fixed amount
      const offset = 25;
      return this.rgbToHex(r + offset, g + offset, b + offset);
    } else {
      // Light background - darken by subtracting
      const offset = 30;
      return this.rgbToHex(r - offset, g - offset, b - offset);
    }
  }

  // Get a visible border color that contrasts with background
  private getBoardBorderColor(bgColor: string): string {
    const { r, g, b } = this.parseColor(bgColor);
    const brightness = (r + g + b) / 3;

    if (brightness < 128) {
      // Dark background - use a lighter border
      const offset = 50;
      return this.rgbToHex(r + offset, g + offset, b + offset);
    } else {
      // Light background - use a darker border
      const offset = 60;
      return this.rgbToHex(r - offset, g - offset, b - offset);
    }
  }

  // Adjust color brightness by factor (for dynamic drawing overlay)
  private adjustColorBrightness(color: string, factor: number): string {
    const { r, g, b } = this.parseColor(color);
    return this.rgbToHex(r * factor, g * factor, b * factor);
  }

  // Draw grid lines for the visible portion of the board (clipped to board bounds)
  drawGridLines(
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    cellSize: number,
    gridLineColors: string[],
    boardCols: number,
    boardRows: number
  ) {
    // Calculate screen bounds for clipping
    const { x: clipLeft, y: clipTop } = viewportManager.cellToScreen(0, 0);
    const { x: clipRight, y: clipBottom } = viewportManager.cellToScreen(boardCols, boardRows);

    // Helper to draw vertical line at column c (clipped to board bounds)
    const drawVerticalLine = (c: number) => {
      if (c < 0 || c > boardCols) return;
      const { x: screenX } = viewportManager.cellToScreen(c, 0);
      this.ctx.moveTo(screenX, clipTop);
      this.ctx.lineTo(screenX, clipBottom);
    };

    // Helper to draw horizontal line at row r (clipped to board bounds)
    const drawHorizontalLine = (r: number) => {
      if (r < 0 || r > boardRows) return;
      const { y: screenY } = viewportManager.cellToScreen(0, r);
      this.ctx.moveTo(clipLeft, screenY);
      this.ctx.lineTo(clipRight, screenY);
    };

    // Draw fine grid lines (every cell)
    this.ctx.beginPath();
    for (let c = startCol; c <= endCol; c++) {
      drawVerticalLine(c);
    }
    for (let r = startRow; r <= endRow; r++) {
      drawHorizontalLine(r);
    }
    this.ctx.strokeStyle = gridLineColors[0];
    this.ctx.lineWidth = 0.35;
    this.ctx.stroke();

    // Draw medium grid lines (every 5 cells)
    this.ctx.beginPath();
    const startCol5 = Math.floor(startCol / 5) * 5;
    const startRow5 = Math.floor(startRow / 5) * 5;
    for (let c = startCol5; c <= endCol; c += 5) {
      if (c >= startCol) drawVerticalLine(c);
    }
    for (let r = startRow5; r <= endRow; r += 5) {
      if (r >= startRow) drawHorizontalLine(r);
    }
    this.ctx.strokeStyle = gridLineColors[1];
    this.ctx.lineWidth = 0.35;
    this.ctx.stroke();

    // Draw thick grid lines (every 10 cells)
    this.ctx.beginPath();
    const startCol10 = Math.floor(startCol / 10) * 10;
    const startRow10 = Math.floor(startRow / 10) * 10;
    for (let c = startCol10; c <= endCol; c += 10) {
      if (c >= startCol) drawVerticalLine(c);
    }
    for (let r = startRow10; r <= endRow; r += 10) {
      if (r >= startRow) drawHorizontalLine(r);
    }
    this.ctx.strokeStyle = gridLineColors[2];
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
  }

  // Draw magenta selected cells and the selection rectangle (viewport-aware)
  private drawSelection(cellDisplaySize: number) {
    const cellSize = boardState.cellSize;

    // Draw selection only if active and visible
    if (boardState.selectionActive && boardState.selectionLattice) {
      const lattice = boardState.selectionLattice;

      // Check if selection is visible in viewport
      if (!viewportManager.isRectVisible(lattice.left, lattice.top, lattice.width, lattice.height)) {
        return; // Selection completely outside viewport
      }

      // Convert selection bounds to screen coordinates
      const { x: screenLeft, y: screenTop } = viewportManager.cellToScreen(lattice.left, lattice.top);
      const width = lattice.width * cellSize;
      const height = lattice.height * cellSize;

      // Draw selection rectangle
      this.ctx.strokeStyle = '#FF00FF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenLeft, screenTop, width, height);

      // Draw selection contents (only visible cells)
      this.ctx.fillStyle = '#FF00FF80';
      const { startCol, startRow, endCol, endRow } = viewportManager.getVisibleCellRange();

      for (let localX = 0; localX < lattice.width; localX++) {
        for (let localY = 0; localY < lattice.height; localY++) {
          const boardCol = localX + lattice.left;
          const boardRow = localY + lattice.top;

          // Skip if outside visible range
          if (boardCol < startCol || boardCol >= endCol || boardRow < startRow || boardRow >= endRow) {
            continue;
          }

          if (lattice.getCell(localX, localY) > 0) {
            const { x: screenX, y: screenY } = viewportManager.cellToScreen(boardCol, boardRow);
            this.ctx.fillRect(screenX, screenY, cellDisplaySize, cellDisplaySize);
          }
        }
      }
    }

    // Draw selection rectangle while selecting
    if (this.isSelecting && this.selectionStartX >= 0 && this.selectionStartY >= 0) {
      const currentX = this.lastPaintX;
      const currentY = this.lastPaintY;

      const selLeft = Math.min(this.selectionStartX, currentX);
      const selTop = Math.min(this.selectionStartY, currentY);
      const selWidth = Math.abs(currentX - this.selectionStartX) + 1;
      const selHeight = Math.abs(currentY - this.selectionStartY) + 1;

      // Convert to screen coordinates
      const { x: screenLeft, y: screenTop } = viewportManager.cellToScreen(selLeft, selTop);
      const width = selWidth * cellSize;
      const height = selHeight * cellSize;

      this.ctx.strokeStyle = '#FF00FF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenLeft, screenTop, width, height);

      // Draw semi-transparent overlay for the selection area
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
      this.ctx.fillRect(screenLeft, screenTop, width, height);
    }
  }

  // Calculate distance between two touch points
  private getTouchDistance(touches: TouchList): number {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance;
  }

  // Handle touch start event
  handleTouchStart(event: TouchEvent) {
    if (gameState.interactMode !== 'pan') return;
    event.preventDefault();

    if (event.touches.length === 1) {
      // Start panning immediately with first touch
      const touch = event.touches[0];

      this.isPinching = false;
      this.isPanning = true;
      this.lastPanX = touch.clientX;
      this.lastPanY = touch.clientY;
      // Store initial virtual scroll position
      this.initialScrollX = viewportManager.scrollX;
      this.initialScrollY = viewportManager.scrollY;
    } else if (event.touches.length === 2) {
      // Switch to pinching when second touch arrives
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 10) {
        return;
      }

      // Stop panning, start pinching
      this.isPanning = false;
      this.isPinching = true;
      this.lastTouchDistance = distance;

      // Calculate and store initial pinch center in screen coordinates
      const rect = this.canvas.getBoundingClientRect();

      // Calculate center in screen coordinates (relative to canvas)
      const screenX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const screenY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      // Convert to cell coordinates using viewport manager
      const { col, row } = viewportManager.screenToCell(screenX, screenY);
      this.pinchCenterX = col;
      this.pinchCenterY = row;
    }
  }

  // Handle touch move event
  handleTouchMove(event: TouchEvent) {
    if (gameState.interactMode !== 'pan') return;
    event.preventDefault();

    if (this.isPinching && event.touches.length === 2) {
      // Handle pinch zoom
      if (this.pinchCenterX === null || this.pinchCenterY === null) {
        return;
      }

      const newDistance = this.getTouchDistance(event.touches);
      const delta = newDistance - this.lastTouchDistance;

      if (Math.abs(delta) > 10) {
        // Add threshold to prevent tiny adjustments
        const zoomDelta = delta > 0 ? 1 : -1;

        // Calculate screen position of pinch center for zoom anchoring
        const rect = this.canvas.getBoundingClientRect();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const screenX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const screenY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        controls.adjustCellSize(zoomDelta, this.pinchCenterX, this.pinchCenterY, screenX, screenY);
        this.lastTouchDistance = newDistance;
      }
    } else if (this.isPanning && event.touches.length === 1) {
      // Handle panning using virtual scroll
      const touch = event.touches[0];
      const dx = touch.clientX - this.lastPanX;
      const dy = touch.clientY - this.lastPanY;

      viewportManager.setScroll(this.initialScrollX - dx, this.initialScrollY - dy);
      this.drawBoard();
    }
  }

  // Handle touch end event
  handleTouchEnd(event: TouchEvent) {
    if (event.touches.length === 0) {
      // Reset all states when all touches end
      this.isPanning = false;
      this.isPinching = false;
      this.pinchCenterX = null;
      this.pinchCenterY = null;
    } else if (event.touches.length === 1 && this.isPinching) {
      // Switch back to panning when going from 2 touches to 1
      const touch = event.touches[0];

      this.isPinching = false;
      this.isPanning = true;
      this.lastPanX = touch.clientX;
      this.lastPanY = touch.clientY;
      // Store current virtual scroll position
      this.initialScrollX = viewportManager.scrollX;
      this.initialScrollY = viewportManager.scrollY;
    }
  }
}

// Create a single instance of the board
const board = new Board('board-canvas');
export { board };
