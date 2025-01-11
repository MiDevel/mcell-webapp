/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// PaintTools.js - Painting tools and utilities
import { boardState } from '../core/BoardState.js';
import { gameState, GameState } from '../core/GameState.js';
import { Lattice } from '../core/Lattice.js';
import { undoSystem, UndoSystem } from '../core/UndoSystem.js';
import { SelectionUtils } from '../utils/SelectionUtils.js';
import { KeyboardState } from '../utils/KeyboardState.js';
import { board } from './Board.js';

export type PaintTool =
  | 'pencil'
  | 'line'
  | 'rectangle'
  | 'rectangle-fill'
  | 'circle'
  | 'circle-fill'
  | 'select'
  | 'copy'
  | 'paste'
  | 'erase-selection'
  | 'invert'
  | 'flip-h'
  | 'flip-v'
  | 'rotate-left'
  | 'rotate-right';

export interface ToolbarButton {
  tool: PaintTool;
  icon: string;
  title: string;
}

export const PAINT_TOOLS: ToolbarButton[] = [
  // First column
  {
    tool: 'pencil',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-pencil"/></svg>',
    title: 'Pencil [A]',
  },
  {
    tool: 'line',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-minus"/></svg>',
    title: 'Line [L]',
  },
  {
    tool: 'rectangle',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-square-outline"/></svg>',
    title: 'Box/Rectangle [B]',
  },
  {
    tool: 'rectangle-fill',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-square"/></svg>',
    title: 'Filled Box/Rectangle [Shift+B]',
  },
  {
    tool: 'circle',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-circle-outline"/></svg>',
    title: 'Oval/Circle [O]',
  },
  {
    tool: 'circle-fill',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-circle"/></svg>',
    title: 'Filled Oval/Circle [Shift+O]',
  },
  // Second column - Selection tools
  {
    tool: 'select',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-select"/></svg>',
    title: 'Select [S]',
  },
  {
    tool: 'erase-selection',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-selection-remove"/></svg>',
    title: 'Erase Selection [in:Delete, out:Shift+Delete]',
  },
  {
    tool: 'copy',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-content-copy"/></svg>',
    title: 'Copy [Ctrl+C]',
  },
  {
    tool: 'paste',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-content-paste"/></svg>',
    title: 'Paste [Ctrl+V]',
  },
  {
    tool: 'flip-h',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-flip-horizontal"/></svg>',
    title: 'Flip Horizontally [X]',
  },
  {
    tool: 'flip-v',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-flip-vertical"/></svg>',
    title: 'Flip Vertically [Y]',
  },
  {
    tool: 'rotate-left',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-rotate-left"/></svg>',
    title: 'Rotate Left [N]',
  },
  {
    tool: 'rotate-right',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-rotate-right"/></svg>',
    title: 'Rotate Right [M]',
  },
  {
    tool: 'invert',
    icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-select-inverse"/></svg>',
    title: 'Invert Selection [I]',
  },
];

export class PaintTools {
  private static readonly PAINTING_TOOLS = [
    'pencil',
    'line',
    'rectangle',
    'rectangle-fill',
    'circle',
    'circle-fill',
  ] as const;
  private static readonly SELECTION_TOOLS = [
    'select',
    'copy',
    'paste',
    'erase-selection',
    'invert',
    'flip-h',
    'flip-v',
    'rotate-left',
    'rotate-right',
  ] as const;

  private activeTool: PaintTool = 'pencil';
  private toolbarElement: HTMLElement | null = null;
  private drawStartX: number = -1;
  private drawStartY: number = -1;
  private lastX: number = -1;
  private lastY: number = -1;
  private isDrawingFromCenter: boolean = false;
  private statusPanel: HTMLElement | null = null;
  private stateForPainting: number = 1;
  private stateLabel: HTMLSpanElement | null = null;
  private statePanel: HTMLElement | null = null;

  constructor() {
    this.createToolbar();
    this.createStatePanel();
    gameState.subscribe(this.onGameStateChange.bind(this));
    // Add keyboard handler
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private createToolbar() {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'paint-toolbar';
    // Initially hide toolbar if not in paint mode
    this.toolbarElement.style.display = gameState.interactMode === 'paint' ? 'grid' : 'none';

    PAINT_TOOLS.forEach((tool) => {
      const button = document.createElement('button');
      button.innerHTML = tool.icon;
      button.title = tool.title;
      button.className = 'paint-tool-button';
      button.dataset.tool = tool.tool; // Store tool type in dataset for easy access
      if (tool.tool === this.activeTool) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => this.setActiveTool(tool.tool));
      this.toolbarElement!.appendChild(button);
    });

    // Create status panel
    this.statusPanel = document.createElement('div');
    this.statusPanel.className = 'status-panel';
    this.statusPanel.innerHTML = 'Coordinates: -, -<br>State: -';
    this.toolbarElement!.appendChild(this.statusPanel);

    // Add toolbar to canvas container to prevent scrolling
    const canvasContainer = document.querySelector('#canvas-container');
    if (canvasContainer) {
      canvasContainer.appendChild(this.toolbarElement);
    }

    // Initial update of button states
    this.updateButtonStates();

    // Subscribe to board state changes to update button states
    gameState.subscribe(() => this.updateButtonStates());
  }

  private createStatePanel() {
    this.statePanel = document.createElement('div');
    this.statePanel.className = 'state-panel';

    const decrementButton = document.createElement('button');
    decrementButton.innerText = '<';
    decrementButton.addEventListener('click', () => this.changeStateForPainting(-1));
    this.statePanel.appendChild(decrementButton);

    this.stateLabel = document.createElement('span');
    this.stateLabel.textContent = this.stateForPainting.toString();
    this.statePanel.appendChild(this.stateLabel);

    const incrementButton = document.createElement('button');
    incrementButton.innerText = '>';
    incrementButton.addEventListener('click', () => this.changeStateForPainting(1));
    this.statePanel.appendChild(incrementButton);

    this.toolbarElement!.appendChild(this.statePanel);
  }

  private changeStateForPainting(delta: number) {
    const maxStates = gameState.getNumberOfStates();
    this.stateForPainting = (this.stateForPainting + delta + maxStates) % maxStates;
    if (this.stateLabel) {
      this.stateLabel.textContent = this.stateForPainting.toString();
    }
  }

  private updateButtonStates() {
    if (!this.toolbarElement) return;

    const buttons = this.toolbarElement.querySelectorAll('.paint-tool-button');
    buttons.forEach((button) => {
      const buttonEl = button as HTMLButtonElement;
      const tool = buttonEl.dataset.tool as PaintTool;

      // Handle transformation tools and copy
      if (['flip-h', 'flip-v', 'rotate-left', 'rotate-right', 'invert', 'copy'].includes(tool)) {
        buttonEl.disabled = !boardState.selectionActive;
      }

      // Handle paste
      if (tool === 'paste') {
        buttonEl.disabled = !boardState.clipboardLattice;
      }

      // Handle erase-selection
      if (tool === 'erase-selection') {
        buttonEl.disabled = !boardState.selectionActive;
      }
    });
  }

  private onGameStateChange(state: GameState) {
    if (this.toolbarElement) {
      this.toolbarElement.style.display = state.interactMode === 'paint' ? 'grid' : 'none';
    }
    const maxState = gameState.getNumberOfStates() - 1;
    if (this.stateForPainting > maxState) {
      this.stateForPainting = maxState;
      if (this.stateLabel) {
        this.stateLabel.textContent = this.stateForPainting.toString();
      }
    }
  }

  isPaintingTool(tool: PaintTool): boolean {
    return (PaintTools.PAINTING_TOOLS as readonly string[]).includes(tool);
  }

  isSelectionTool(tool: PaintTool): boolean {
    return (PaintTools.SELECTION_TOOLS as readonly string[]).includes(tool);
  }

  getActiveTool(): PaintTool {
    return this.activeTool;
  }

  setActiveTool(tool: PaintTool) {
    // If switching from select tool to a painting tool and selection is active, apply it
    if (this.activeTool === 'select' && this.isPaintingTool(tool) && boardState.selectionActive) {
      boardState.applySelection();
    }

    // Handle transformation tools
    switch (tool) {
      case 'flip-h':
        SelectionUtils.flipHorizontal();
        return;
      case 'flip-v':
        SelectionUtils.flipVertical();
        return;
      case 'rotate-left':
        SelectionUtils.rotateLeft();
        return;
      case 'rotate-right':
        SelectionUtils.rotateRight();
        return;
      case 'invert':
        SelectionUtils.invert();
        return;
      case 'erase-selection':
        const clearInside = !KeyboardState.getInstance().isShiftPressed();
        SelectionUtils.eraseSelection(clearInside);
        return;
      case 'copy':
        SelectionUtils.copy();
        return;
      case 'paste':
        SelectionUtils.paste();
        return;
    }

    this.activeTool = tool;
    if (this.toolbarElement) {
      const buttons = this.toolbarElement.querySelectorAll('.paint-tool-button');
      buttons.forEach((btn, index) => {
        btn.classList.toggle('active', PAINT_TOOLS[index].tool === tool);
      });
    }
  }

  startDraw(x: number, y: number, event: MouseEvent) {
    if (!this.isPaintingTool(this.activeTool)) return;

    this.drawStartX = x;
    this.drawStartY = y;
    this.lastX = x;
    this.lastY = y;

    // Initialize dynamic drawing lattice
    if (this.activeTool !== 'pencil') {
      boardState.dynaDrawLattice = new Lattice(boardState.lattice.width, boardState.lattice.height);
      boardState.dynaDrawActive = true;
    }

    if (this.activeTool === 'pencil') {
      undoSystem.addItem(UndoSystem.UNDO_EVT_EDIT);
      this.addPoint(x, y);
    }
  }

  continueDraw(x: number, y: number, event: MouseEvent) {
    if (!this.isPaintingTool(this.activeTool)) return;

    if (this.activeTool === 'pencil') {
      this.drawLine(this.lastX, this.lastY, x, y, this.stateForPainting);
      this.lastX = x;
      this.lastY = y;
      // Force board redraw for pencil tool
      board.drawBoard();
      return;
    }

    if (!boardState.dynaDrawLattice) return;

    // Clear previous dynamic drawing
    boardState.dynaDrawLattice.clear();

    const constrainShape = event.shiftKey;
    this.isDrawingFromCenter = event.ctrlKey || event.metaKey;
    let points: Array<{ x: number; y: number }> = [];

    switch (this.activeTool) {
      case 'line':
        points = this.getLinePoints(
          this.drawStartX,
          this.drawStartY,
          x,
          y,
          this.isDrawingFromCenter,
          constrainShape
        );
        break;
      case 'rectangle':
      case 'rectangle-fill':
        points = this.getRectanglePoints(
          this.drawStartX,
          this.drawStartY,
          x,
          y,
          this.activeTool === 'rectangle-fill',
          this.isDrawingFromCenter,
          constrainShape
        );
        break;
      case 'circle':
      case 'circle-fill':
        points = this.getCirclePoints(
          this.drawStartX,
          this.drawStartY,
          x,
          y,
          this.activeTool === 'circle-fill',
          this.isDrawingFromCenter,
          constrainShape
        );
        break;
    }

    // Draw points to dynamic drawing lattice
    points.forEach((point) => {
      if (this.isValidCell(point.x, point.y)) {
        // Use -1 for state 0 (erasing)
        const state = this.stateForPainting === 0 ? -1 : this.stateForPainting;
        boardState.dynaDrawLattice!.setCell(point.x, point.y, state);
      }
    });

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      gameState.setState({ isContentDirty: true });
      board.drawBoard();
    });
  }

  endDraw(x: number, y: number, event: MouseEvent) {
    if (!this.isPaintingTool(this.activeTool)) return;

    if (this.activeTool !== 'pencil' && boardState.dynaDrawLattice) {
      // Add current state to undo history
      undoSystem.addItem(UndoSystem.UNDO_EVT_EDIT);

      // Transfer cells from dynaDrawLattice to main lattice
      for (let x = 0; x < boardState.dynaDrawLattice.width; x++) {
        for (let y = 0; y < boardState.dynaDrawLattice.height; y++) {
          const state = boardState.dynaDrawLattice.getCell(x, y);
          // Apply both positive states and -1 (erasing)
          if (state !== 0) {
            boardState.lattice.setCell(x, y, state === -1 ? 0 : state);
          }
        }
      }

      // Clear dynamic drawing state
      boardState.dynaDrawActive = false;
      boardState.dynaDrawLattice = null;
    }

    this.drawStartX = -1;
    this.drawStartY = -1;
    this.lastX = -1;
    this.lastY = -1;

    gameState.setState({ isContentDirty: true });
  }

  updateStatusPanel(x: number, y: number, state: number) {
    if (this.statusPanel) {
      if (x === -1 && y === -1) {
        this.statusPanel.innerHTML = '(???, ???)<br>State: ???';
      } else {
        this.statusPanel.innerHTML = `(${x}, ${y})<br>State: ${state}`;
      }
    }
  }

  private isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < boardState.lattice.width && y >= 0 && y < boardState.lattice.height;
  }

  private addPointIfValid(points: Array<{ x: number; y: number }>, x: number, y: number) {
    if (this.isValidCell(x, y)) {
      points.push({ x, y });
    }
  }

  private getLinePoints(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    fromCenter: boolean,
    constrain: boolean
  ): Array<{ x: number; y: number }> {
    let startX = x0;
    let startY = y0;
    let endX = x1;
    let endY = y1;

    if (constrain) {
      // Constrain to 45-degree angles
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx * dx + dy * dy);
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      endX = startX + Math.round(length * Math.cos(snapAngle));
      endY = startY + Math.round(length * Math.sin(snapAngle));
    }

    if (fromCenter) {
      // Adjust line to draw from center
      const dx = endX - startX;
      const dy = endY - startY;
      startX = startX - dx;
      startY = startY - dy;
      endX = startX + dx * 2;
      endY = startY + dy * 2;
    }

    const points: Array<{ x: number; y: number }> = [];
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.addPointIfValid(points, startX, startY);
      if (startX === endX && startY === endY) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        startX += sx;
      }
      if (e2 < dx) {
        err += dx;
        startY += sy;
      }
    }

    return points;
  }

  private getRectanglePoints(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    filled: boolean,
    fromCenter: boolean,
    constrainSquare: boolean
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    if (constrainSquare) {
      // Make it a square based on the larger dimension
      const width = Math.abs(x1 - x0);
      const height = Math.abs(y1 - y0);
      const size = Math.max(width, height);
      const signX = Math.sign(x1 - x0) || 1;
      const signY = Math.sign(y1 - y0) || 1;
      x1 = x0 + size * signX;
      y1 = y0 + size * signY;
    }

    if (fromCenter) {
      // Convert end point to be relative to start point
      const dx = x1 - x0;
      const dy = y1 - y0;
      x0 = x0 - dx;
      y0 = y0 - dy;
      x1 = x0 + 2 * dx;
      y1 = y0 + 2 * dy;
    }

    const [startX, endX] = [Math.min(x0, x1), Math.max(x0, x1)];
    const [startY, endY] = [Math.min(y0, y1), Math.max(y0, y1)];

    if (filled) {
      // Add all points within the rectangle
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          this.addPointIfValid(points, x, y);
        }
      }
    } else {
      // Add only the outline points
      for (let x = startX; x <= endX; x++) {
        this.addPointIfValid(points, x, startY);
        this.addPointIfValid(points, x, endY);
      }
      for (let y = startY + 1; y < endY; y++) {
        this.addPointIfValid(points, startX, y);
        this.addPointIfValid(points, endX, y);
      }
    }

    return points;
  }

  private getCirclePoints(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    filled: boolean,
    fromCenter: boolean,
    constrainCircle: boolean
  ): Array<{ x: number; y: number }> {
    const points = new Set<string>();
    const result: Array<{ x: number; y: number }> = [];

    if (fromCenter) {
      // Convert end point to be relative to start point
      const dx = x1 - x0;
      const dy = y1 - y0;
      x0 = x0 - dx;
      y0 = y0 - dy;
      x1 = x0 + 2 * dx;
      y1 = y0 + 2 * dy;
    }

    // Calculate center and radius
    const centerX = (x0 + x1) / 2;
    const centerY = (y0 + y1) / 2;
    let radiusX = Math.abs(x1 - x0) / 2;
    let radiusY = Math.abs(y1 - y0) / 2;

    if (constrainCircle) {
      // Make it a perfect circle using the larger radius
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }

    if (filled) {
      // Use scanline fill algorithm
      const minX = Math.floor(centerX - radiusX);
      const maxX = Math.ceil(centerX + radiusX);
      const minY = Math.floor(centerY - radiusY);
      const maxY = Math.ceil(centerY + radiusY);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          // Check if point is inside ellipse using the equation (x-h)²/a² + (y-k)²/b² ≤ 1
          const dx = (x - centerX) / radiusX;
          const dy = (y - centerY) / radiusY;
          if (dx * dx + dy * dy <= 1) {
            if (this.isValidCell(x, y)) {
              result.push({ x, y });
            }
          }
        }
      }
    } else {
      // Just get the outline using midpoint algorithm
      this.getCircleOutlinePoints(
        centerX,
        centerY,
        Math.max(radiusX, radiusY),
        radiusX,
        radiusY,
        points
      );

      // Convert unique point strings back to point objects and filter invalid points
      for (const pointStr of points) {
        const [x, y] = pointStr.split(',').map(Number);
        if (this.isValidCell(x, y)) {
          result.push({ x, y });
        }
      }
    }

    return result;
  }

  private getCircleOutlinePoints(
    centerX: number,
    centerY: number,
    radius: number,
    scaleX: number,
    scaleY: number,
    points: Set<string>
  ): void {
    const addPoint = (x: number, y: number) => {
      const px = Math.round(centerX + x * (scaleX / radius));
      const py = Math.round(centerY + y * (scaleY / radius));
      points.add(`${px},${py}`);
    };

    let x = 0;
    let y = radius;
    let d = 1 - radius;

    while (y >= x) {
      addPoint(x, y);
      addPoint(x, -y);
      addPoint(-x, y);
      addPoint(-x, -y);
      addPoint(y, x);
      addPoint(y, -x);
      addPoint(-y, x);
      addPoint(-y, -x);

      x++;
      if (d < 0) {
        d += 2 * x + 1;
      } else {
        y--;
        d += 2 * (x - y) + 1;
      }
    }
  }

  private drawLine(x0: number, y0: number, x1: number, y1: number, state: number) {
    // Use -1 for state 0 (erasing)
    const drawState = state === 0 ? -1 : state;
    const points = this.getLinePoints(x0, y0, x1, y1, false, false);
    points.forEach((point) => {
      if (this.isValidCell(point.x, point.y)) {
        boardState.lattice.setCell(point.x, point.y, drawState === -1 ? 0 : drawState);
      }
    });
  }

  private addPoint(x: number, y: number) {
    // Use -1 for state 0 (erasing)
    const state = this.stateForPainting === 0 ? -1 : this.stateForPainting;
    boardState.lattice.setCell(x, y, state === -1 ? 0 : state);
    gameState.setState({ isContentDirty: true });
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Only handle keys in paint mode
    if (gameState.interactMode !== 'paint') return;

    if (event.key === 'Escape') {
      if (boardState.dynaDrawActive) {
        // Cancel dynamic drawing
        this.cancelDraw();
        return;
      }
    }

    // Handle state increment/decrement
    if (event.key === ',' || event.key === '<') {
      this.changeStateForPainting(-1);
      return;
    }
    if (event.key === '.' || event.key === '>') {
      this.changeStateForPainting(1);
      return;
    }

    // Handle tool shortcuts
    const key = event.key.toLowerCase();
    let isCtrl = event.ctrlKey || event.metaKey;
    let isAlt = event.altKey;

    // Handle arrow keys for selection movement
    if (SelectionUtils.hasSelection()) {
      let moveAmount = 1;
      if (event.shiftKey && isCtrl) {
        moveAmount = 20;
      } else if (isCtrl || isAlt) {
        moveAmount = 10;
      } else if (event.shiftKey) {
        moveAmount = 5;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          SelectionUtils.moveSelection(-moveAmount, 0);
          return;
        case 'ArrowRight':
          event.preventDefault();
          SelectionUtils.moveSelection(moveAmount, 0);
          return;
        case 'ArrowUp':
          event.preventDefault();
          SelectionUtils.moveSelection(0, -moveAmount);
          return;
        case 'ArrowDown':
          event.preventDefault();
          SelectionUtils.moveSelection(0, moveAmount);
          return;
      }
    }

    // Ctrl combos
    if (isCtrl && !isAlt) {
      switch (key) {
        case 'a':
          // Handle Ctrl+A for select all
          event.preventDefault();
          this.setActiveTool('select');
          SelectionUtils.selectAll();
          return;
      }
    }

    // Simple keys follow, no Ctrl/Cmd/Alt modifiers.
    // Copy/Paste are already handled by Controls.ts
    if (isCtrl || isAlt) {
      return;
    }

    switch (key) {
      case 'a':
        this.setActiveTool('pencil');
        break;
      case 'l':
        this.setActiveTool('line');
        break;
      case 'b':
        this.setActiveTool(event.shiftKey ? 'rectangle-fill' : 'rectangle');
        break;
      case 'o':
        this.setActiveTool(event.shiftKey ? 'circle-fill' : 'circle');
        break;
      case 'delete':
        this.setActiveTool('erase-selection');
        break;
      case 's':
        this.setActiveTool('select');
        break;
      case 'x':
        this.setActiveTool('flip-h');
        break;
      case 'y':
        this.setActiveTool('flip-v');
        break;
      case 'n':
        this.setActiveTool('rotate-left');
        break;
      case 'm':
        this.setActiveTool('rotate-right');
        break;
      case 'i':
        this.setActiveTool('invert');
        break;
      default:
        // Handle numeric keys for state selection
        const numKey = parseInt(event.key);
        if (!isNaN(numKey) && numKey >= 0 && numKey <= 9) {
          const maxStates = gameState.getNumberOfStates();
          if (numKey < maxStates) {
            this.stateForPainting = numKey;
            if (this.stateLabel) {
              this.stateLabel.textContent = numKey.toString();
            }
          }
        }
        break;
    }
  }

  private cancelDraw() {
    if (boardState.dynaDrawActive) {
      // Just clear dynamic drawing state without applying changes
      boardState.dynaDrawActive = false;
      boardState.dynaDrawLattice = null;
      this.drawStartX = -1;
      this.drawStartY = -1;
      this.lastX = -1;
      this.lastY = -1;
      gameState.setState({ isContentDirty: true });
    }
  }
}

export const paintTools = new PaintTools();
