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
    this.drawBoard(); // Initial draw
  }

  initializeCanvas() {
    const numCols = boardState.lattice.width;
    const numRows = boardState.lattice.height;

    this.canvas.width = numCols * boardState.cellSize;
    this.canvas.height = numRows * boardState.cellSize;

    // Get container
    const container: HTMLElement | null = this.canvas.parentElement;
    if (!container) {
      throw new Error('Board container not found.');
    }

    // Set canvas styles
    this.canvas.style.position = 'absolute';
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;

    // Center horizontally if board is smaller than container
    if (this.canvas.width < container.clientWidth) {
      this.canvas.style.left = `${(container.clientWidth - this.canvas.width) / 2}px`;
    } else {
      this.canvas.style.left = '0';
    }

    this.canvas.style.top = '0';

    // Ensure container can accommodate the canvas size
    container.style.minWidth = 'auto';
    container.style.minHeight = 'auto';
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
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: 1,
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
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: 1,
        });
        this.handleMouseMove(mouseEvent);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const mouseEvent = new MouseEvent('mouseup', {
          buttons: 0,
        });
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
    const x = Math.floor((e.clientX - rect.left) / boardState.cellSize);
    const y = Math.floor((e.clientY - rect.top) / boardState.cellSize);
    return { x, y };
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
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellX = Math.floor(x / boardState.cellSize);
    const cellY = Math.floor(y / boardState.cellSize);

    if (gameState.interactMode === 'pan') {
      this.isPanning = true;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      const container = this.canvas.parentElement;
      if (container) {
        this.initialScrollX = container.scrollLeft;
        this.initialScrollY = container.scrollTop;
      }
      this.canvas.style.cursor = 'grabbing';
    } else if (gameState.interactMode === 'paint') {
      const currentTool = paintTools.getActiveTool();

      if (currentTool === 'select') {
        const x = Math.floor(event.offsetX / boardState.cellSize);
        const y = Math.floor(event.offsetY / boardState.cellSize);

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
    // Always update mouse position for cursor updates
    const x = Math.floor(event.offsetX / boardState.cellSize);
    const y = Math.floor(event.offsetY / boardState.cellSize);
    const state = boardState.lattice.getCell(x, y);
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

      const container = this.canvas.parentElement;
      if (container) {
        container.scrollLeft = this.initialScrollX - dx;
        container.scrollTop = this.initialScrollY - dy;
      }
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
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cellX = Math.floor(x / boardState.cellSize);
      const cellY = Math.floor(y / boardState.cellSize);
      paintTools.continueDraw(cellX, cellY, event);
      this.lastPaintX = cellX;
      this.lastPaintY = cellY;
    }

    this.updateCursor();
  }

  // Add zoom functionality
  handleWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) {
      controls.adjustCellSize(1);
    } else {
      controls.adjustCellSize(-1);
    }
  }

  handleMouseUp(event: MouseEvent) {
    if (this.isPainting && paintTools.getActiveTool() === 'select' && boardState.selectionActive) {
      const x = Math.floor(event.offsetX / boardState.cellSize);
      const y = Math.floor(event.offsetY / boardState.cellSize);

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
      const x = Math.floor(event.offsetX / boardState.cellSize);
      const y = Math.floor(event.offsetY / boardState.cellSize);

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
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cellX = Math.floor(x / boardState.cellSize);
      const cellY = Math.floor(y / boardState.cellSize);
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

  // Draw the complete board
  drawBoard() {
    // console.log(`Board draw ${this.numBoardDraws}`);
    this.numBoardDraws = this.numBoardDraws ? this.numBoardDraws + 1 : 1;

    const numCols = boardState.lattice.width;
    const numRows = boardState.lattice.height;
    const cellSize = boardState.cellSize;
    const cellDisplaySize = this.checkIfToDrawGrid()
      ? cellSize - 1
      : boardState.cellSize >= Constants.MIN_GRID_CELL_SIZE
        ? cellSize - 1
        : cellSize;
    const currentPalette: Palette = palettes.getPalette(settings.getPaletteName());

    // Fill the entire canvas with the color for state 0
    this.ctx.fillStyle = currentPalette.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines
    if (this.checkIfToDrawGrid()) {
      this.drawGridLines(numCols, numRows, cellSize, currentPalette.gridLineColors);
    }

    // Draw cells
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const state = boardState.lattice.getCell(x, y);
        if (state > 0) {
          this.ctx.fillStyle = currentPalette.colors[state % currentPalette.colors.length];
          this.ctx.fillRect(x * cellSize, y * cellSize, cellDisplaySize, cellDisplaySize);
        }
      }
    }

    // Draw dynamic drawing overlay if active
    if (boardState.dynaDrawActive && boardState.dynaDrawLattice) {
      let lastDynaDrawState = -9999;
      for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
          const state = boardState.dynaDrawLattice.getCell(x, y);
          // Draw both positive states (normal cells) and -1 (erasing)
          if (state !== 0) {
            if (lastDynaDrawState !== state) {
              // For erasing (state -1), use state 0's color
              const colorState = state === -1 ? 0 : state;
              this.ctx.fillStyle = this.dynaDrawColors[colorState % currentPalette.colors.length];
              lastDynaDrawState = state;
            }
            this.ctx.fillRect(x * cellSize, y * cellSize, cellDisplaySize, cellDisplaySize);
          }
        }
      }
    }

    // Draw selection
    this.drawSelection(cellDisplaySize);
  }

  // Helper method to adjust color brightness
  private adjustColorBrightness(color: string, factor: number): string {
    // Parse the color (handles both hex and rgb formats)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    const rgbColor = ctx.fillStyle;

    // Convert to RGB
    const r = parseInt(rgbColor.slice(1, 3), 16);
    const g = parseInt(rgbColor.slice(3, 5), 16);
    const b = parseInt(rgbColor.slice(5, 7), 16);

    // Adjust brightness
    const adjustedR = Math.min(255, Math.round(r * factor));
    const adjustedG = Math.min(255, Math.round(g * factor));
    const adjustedB = Math.min(255, Math.round(b * factor));

    // Convert back to hex
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
  }

  // Add grid lines to the board
  drawGridLines(cols: number, rows: number, cellSize: number, gridLineColors: string[]) {
    this.ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = c * cellSize;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * cellSize;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
    }
    this.ctx.strokeStyle = gridLineColors[0];
    this.ctx.lineWidth = 0.35;
    this.ctx.stroke();

    this.ctx.beginPath();
    for (let c = 0; c <= cols; c += 5) {
      const x = c * cellSize;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
    }
    for (let r = 0; r <= rows; r += 5) {
      const y = r * cellSize;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
    }
    this.ctx.strokeStyle = gridLineColors[1];
    this.ctx.lineWidth = 0.35;
    this.ctx.stroke();

    this.ctx.beginPath();
    for (let c = 0; c <= cols; c += 10) {
      const x = c * cellSize;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
    }
    for (let r = 0; r <= rows; r += 10) {
      const y = r * cellSize;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
    }
    this.ctx.strokeStyle = gridLineColors[2];
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
  }

  // Draw magenta selected cells and the selection rectangle
  private drawSelection(cellDisplaySize: number) {
    // Draw selection only if active
    if (boardState.selectionActive && boardState.selectionLattice) {
      const lattice = boardState.selectionLattice;
      const left = lattice.left * boardState.cellSize;
      const top = lattice.top * boardState.cellSize;
      const width = lattice.width * boardState.cellSize;
      const height = lattice.height * boardState.cellSize;

      // Draw selection rectangle
      this.ctx.strokeStyle = '#FF00FF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(left, top, width, height);

      // Draw selection contents
      this.ctx.fillStyle = '#FF00FF80';
      for (let x = 0; x < lattice.width; x++) {
        for (let y = 0; y < lattice.height; y++) {
          if (lattice.getCell(x, y) > 0) {
            this.ctx.fillRect(
              (x + lattice.left) * boardState.cellSize,
              (y + lattice.top) * boardState.cellSize,
              cellDisplaySize,
              cellDisplaySize
            );
          }
        }
      }
    }

    // Draw selection rectangle while selecting
    if (this.isSelecting && this.selectionStartX >= 0 && this.selectionStartY >= 0) {
      const currentX = this.lastPaintX;
      const currentY = this.lastPaintY;

      const left = Math.min(this.selectionStartX, currentX) * boardState.cellSize;
      const top = Math.min(this.selectionStartY, currentY) * boardState.cellSize;
      const width = Math.abs(currentX - this.selectionStartX + 1) * boardState.cellSize;
      const height = Math.abs(currentY - this.selectionStartY + 1) * boardState.cellSize;

      this.ctx.strokeStyle = '#FF00FF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(left, top, width, height);

      // Draw semi-transparent overlay for the selection area
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
      this.ctx.fillRect(left, top, width, height);
    }
  }
}

// Create a single instance of the board
const board = new Board('board-canvas');
export { board };
