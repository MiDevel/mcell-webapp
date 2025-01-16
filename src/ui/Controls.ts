/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Controls.js - Handles user input and updates the game state
import { settings } from '../core/Settings.js';
import { settingsDialog } from '../dialogs/SettingsDialog.js';
import { gameState, GameState } from '../core/GameState.js';
import { Lattice } from '../core/Lattice.js';
import { boardState } from '../core/BoardState.js';
import { palettes } from './Palettes.js';
import { diversities } from '../core/Diversities.js';
import { CaLexiconEntry } from '../core/CaLexicon.js';
import { caPatterns, CaPattern } from '../core/CaPatterns.js';
import { CaPatternData } from '../utils/CaPatternData.js';
import { patternLoader } from '../loaders/PatternLoader.js';
import { Constants } from '../utils/Constants.js';
import { dialog } from '../dialogs/Dialog.js';
import { patternDescriptionDialog } from '../dialogs/PatternDescriptionDialog.js';
import { aboutDialog } from '../dialogs/AboutDialog.js';
import { randomizeDialog } from '../dialogs/RandomizeDialog.js';
import { seederDialog } from '../dialogs/SeederDialog.js';
import { diversitiesDialog } from '../dialogs/DiversitiesDialog.js';
import { rulesDialog } from '../dialogs/RulesDialog.js';
import { boardDialog } from '../dialogs/BoardDialog.js';
import { helpDialog } from '../dialogs/HelpDialog.js';
import { runNumDialog } from '../dialogs/RunNumDialog.js';
import { UndoSystem, undoSystem } from '../core/UndoSystem.js';
import { undoDialog } from '../dialogs/UndoDialog.js';
import { histogramDialog } from '../dialogs/HistogramDialog.js';
import { savePatternDialog } from '../dialogs/SavePatternDialog.js';
import { IOUtils } from '../utils/IOUtils.js';
import { CaEngines, caEngines } from '../core/CaEngines.js';
import { SelectionUtils } from '../utils/SelectionUtils.js';
import { runSpeedTest } from '../tests/PerformanceTests.js';
import { dumpPattern, dumpStateInfo } from '../tests/stateDump.js';

interface TLastSelectedRule {
  family: string;
  rule: string;
}

export class Controls {
  private startStopBtn: HTMLButtonElement | null;
  private runOneBtn: HTMLButtonElement | null;
  private runNumBtn: HTMLButtonElement | null;
  private rulesBtn: HTMLButtonElement | null;
  private speedBtn: HTMLButtonElement | null;
  private undoBtn: HTMLButtonElement | null;
  private undoHistoryBtn: HTMLButtonElement | null;
  private redoBtn: HTMLButtonElement | null;
  private speedIndicator: HTMLDivElement | null;
  private speedMenu: HTMLDivElement | null;
  private viewModeSelect: HTMLSelectElement | null;
  private familySelect: HTMLSelectElement | null;
  private ruleSelect: HTMLSelectElement | null;
  private clearBtn: HTMLButtonElement | null;
  private randomizeBtn: HTMLButtonElement | null;
  private randomizeSettingsBtn: HTMLButtonElement | null;
  private seedBtn: HTMLButtonElement | null;
  private seedSettingsBtn: HTMLButtonElement | null;
  private cycleDisplay: HTMLSpanElement | null;
  private ruleDisplay: HTMLSpanElement | null;
  private boardSizeDisplay: HTMLSpanElement | null;
  private boardBtn: HTMLButtonElement | null;
  private panModeBtn: HTMLButtonElement | null;
  private paintModeBtn: HTMLButtonElement | null;
  private toggleLeftPanelBtn: HTMLButtonElement | null;
  private leftPanel: HTMLDivElement | null;
  private patternList: HTMLDivElement | null;
  private patternControls: HTMLDivElement | null;
  private diversitiesBtn: HTMLButtonElement | null;
  private patternBrowser: HTMLDivElement | null;
  private histogramBtn: HTMLButtonElement | null;
  private menuBtn: HTMLButtonElement | null;
  private menuDropdown: HTMLDivElement | null = null;
  private isMenuOpen: boolean = false;
  private ignoreNextClick: boolean = false;

  lastSelectedRules: Array<TLastSelectedRule>;

  constructor() {
    this.startStopBtn = document.getElementById('startStopBtn') as HTMLButtonElement;
    this.runOneBtn = document.getElementById('runOneBtn') as HTMLButtonElement;
    this.runNumBtn = document.getElementById('runNumBtn') as HTMLButtonElement;
    this.rulesBtn = document.getElementById('rulesBtn') as HTMLButtonElement;
    this.speedBtn = document.getElementById('speedBtn') as HTMLButtonElement;
    this.undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    this.undoHistoryBtn = document.getElementById('undoHistoryBtn') as HTMLButtonElement;
    this.redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
    this.viewModeSelect = document.getElementById('viewMode') as HTMLSelectElement;
    this.familySelect = document.getElementById('family') as HTMLSelectElement;
    this.ruleSelect = document.getElementById('rule') as HTMLSelectElement;
    this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    this.randomizeBtn = document.getElementById('randomizeBtn') as HTMLButtonElement;
    this.randomizeSettingsBtn = document.getElementById(
      'randomizeSettingsBtn'
    ) as HTMLButtonElement;
    this.seedBtn = document.getElementById('seedBtn') as HTMLButtonElement;
    this.seedSettingsBtn = document.getElementById('seedSettingsBtn') as HTMLButtonElement;
    this.cycleDisplay = document.getElementById('cycle-display') as HTMLSpanElement;
    this.ruleDisplay = document.getElementById('rule-display') as HTMLSpanElement;
    this.boardSizeDisplay = document.getElementById('board-size-display') as HTMLSpanElement;
    this.boardBtn = document.getElementById('boardBtn') as HTMLButtonElement;
    this.panModeBtn = document.querySelector('.mode-pan') as HTMLButtonElement;
    this.paintModeBtn = document.querySelector('.mode-paint') as HTMLButtonElement;
    this.toggleLeftPanelBtn = document.getElementById('toggleLeftPanelBtn') as HTMLButtonElement;
    this.leftPanel = document.getElementById('left-panel') as HTMLDivElement;
    this.patternList = document.getElementById('pattern-list') as HTMLDivElement;
    this.patternControls = document.getElementById('pattern-controls') as HTMLDivElement;
    this.diversitiesBtn = document.getElementById('diversitiesBtn') as HTMLButtonElement;
    this.patternBrowser = document.getElementById('pattern-browser') as HTMLDivElement;
    this.histogramBtn = document.getElementById('histogramBtn') as HTMLButtonElement;
    this.menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;

    if (!this.startStopBtn) throw new Error('startStopBtn is not defined');
    if (!this.runOneBtn) throw new Error('runOneBtn is not defined');
    if (!this.runNumBtn) throw new Error('runNumBtn is not defined');
    if (!this.rulesBtn) throw new Error('rulesBtn is not defined');
    if (!this.speedBtn) throw new Error('speedBtn is not defined');
    if (!this.undoBtn) throw new Error('undoBtn is not defined');
    if (!this.redoBtn) throw new Error('redoBtn is not defined');
    if (!this.undoHistoryBtn) throw new Error('undoHistoryBtn is not defined');
    if (!this.viewModeSelect) throw new Error('viewModeSelect is not defined');
    if (!this.familySelect) throw new Error('familySelect is not defined');
    if (!this.ruleSelect) throw new Error('ruleSelect is not defined');
    if (!this.clearBtn) throw new Error('clearBtn is not defined');
    if (!this.randomizeBtn) throw new Error('randomizeBtn is not defined');
    if (!this.randomizeSettingsBtn) throw new Error('randomizeSettingsBtn is not defined');
    if (!this.seedBtn) throw new Error('seedBtn is not defined');
    if (!this.seedSettingsBtn) throw new Error('seedSettingsBtn is not defined');
    if (!this.cycleDisplay) throw new Error('cycleDisplay is not defined');
    if (!this.ruleDisplay) throw new Error('ruleDisplay is not defined');
    if (!this.boardSizeDisplay) throw new Error('boardSizeDisplay is not defined');
    if (!this.boardBtn) throw new Error('boardBtn is not defined');
    if (!this.panModeBtn) throw new Error('panModeBtn is not defined');
    if (!this.paintModeBtn) throw new Error('paintModeBtn is not defined');
    if (!this.toggleLeftPanelBtn) throw new Error('toggleLeftPanelBtn is not defined');
    if (!this.leftPanel) throw new Error('leftPanel is not defined');
    if (!this.patternList) throw new Error('patternList is not defined');
    if (!this.patternControls) throw new Error('patternControls is not defined');
    if (!this.diversitiesBtn) throw new Error('diversitiesBtn is not defined');
    if (!this.histogramBtn) throw new Error('histogramBtn is not defined');

    // Create speed menu
    this.speedMenu = document.createElement('div');
    this.speedMenu.className = 'speed-menu';
    document.body.appendChild(this.speedMenu);

    // Create speed indicator
    this.speedIndicator = document.createElement('div');
    this.speedIndicator.className = 'speed-indicator';
    this.startStopBtn!.appendChild(this.speedIndicator);

    // Add speed options
    const speeds = [
      { value: 0, label: 'Max Speed' },
      { value: 10, label: '10ms' },
      { value: 25, label: '25ms' },
      { value: 50, label: '50ms' },
      { value: 100, label: '100ms' },
      { value: 250, label: '250ms' },
      { value: 500, label: '500ms' },
      { value: 1000, label: '1s' },
      { value: 5000, label: '5s' },
    ];

    speeds.forEach((speed) => {
      const item = document.createElement('div');
      item.className = 'speed-menu-item';
      item.textContent = speed.label;
      item.dataset.speed = speed.value.toString();
      this.speedMenu!.appendChild(item);
    });

    // Create menu dropdown
    this.setupMenuButton();

    this.initializeEventListeners();
    gameState.subscribe(this.onGameStateChange.bind(this));

    // Initialize lastSelectedRules with defaults
    this.lastSelectedRules = [];
    this.lastSelectedRules.push({ family: CaEngines.FAMILY_LIFE, rule: '23/3' }); // Conway's Life
    this.lastSelectedRules.push({ family: CaEngines.FAMILY_GENERATIONS, rule: '345/2/4' }); // StarWars

    IOUtils.setupDragAndDrop('canvas-container', (patternData: CaPatternData) => {
      if (patternData && patternData.loadSuccess) {
        this.applyPattern(patternData);
        // Remove highlight from previous active pattern in the pattern browser
        this.removePatternHighlight(this.patternList!);
      }
    });
  }

  async initialize() {
    // Show loading dialog
    dialog.show(
      'Loading',
      `
            <div style="text-align: center; padding: 20px;">
                <div>Loading assets and initializing...</div>
                <div style="margin-top: 10px;">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `
    );

    try {
      await gameState.initialize();
      await this.setupViewModeSelect(); // This will call either showMustSeePatterns() or populateFamilyOptions()
    } finally {
      // Hide loading dialog
      dialog.close();
    }

    // testing diversities
    // diversities.applyConfigString('#SYSTEM,act=1');
    // diversities.applyConfigString('#SNOVA,act=1,x=0,y=0,size=6,stt=1');
    // diversities.applyConfigString('#NOISE,act=1,cycl=1,cell=3,stt=1');
  }

  initializeEventListeners() {
    this.startStopBtn!.addEventListener('click', () => this.toggleRunning());
    this.runOneBtn!.addEventListener('click', () => this.runOnce());
    this.runNumBtn!.addEventListener('click', () => runNumDialog.show());
    this.rulesBtn!.addEventListener('click', () => this.showRulesDialog());
    this.undoBtn!.addEventListener('click', () => this.undo());
    this.redoBtn!.addEventListener('click', () => this.redo());
    this.undoHistoryBtn!.addEventListener('click', () => this.showUndoDialog());
    this.speedBtn!.addEventListener('click', (event) => {
      event.stopPropagation();
      const buttonRect = this.speedBtn!.getBoundingClientRect();
      this.speedMenu!.style.top = `${buttonRect.bottom}px`;
      this.speedMenu!.style.left = `${buttonRect.left}px`;
      this.speedMenu!.classList.toggle('visible');

      // Update selected item
      const items = this.speedMenu!.querySelectorAll('.speed-menu-item');
      items.forEach((item) => {
        if (parseInt((item as HTMLElement).dataset.speed!) === gameState.speed) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    });

    this.speedMenu!.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('speed-menu-item')) {
        const speed = parseInt(target.dataset.speed!);
        this.setSpeed(speed);
        this.speedMenu!.classList.remove('visible');
      }
    });

    // Close speed menu when clicking outside
    document.addEventListener('click', () => {
      this.speedMenu!.classList.remove('visible');
    });

    this.familySelect!.addEventListener('change', () => this.updateFamily());
    this.ruleSelect!.addEventListener('change', () => this.updateRule());
    this.clearBtn!.addEventListener('click', () => this.clear());
    this.randomizeBtn!.addEventListener('click', () => {
      boardState.randomize();
    });
    this.randomizeSettingsBtn!.addEventListener('click', () => {
      randomizeDialog.show();
    });
    this.seedBtn!.addEventListener('click', () => {
      boardState.seed();
    });
    this.seedSettingsBtn!.addEventListener('click', () => {
      seederDialog.show();
    });
    this.boardBtn!.addEventListener('click', () => boardDialog.show());
    this.panModeBtn!.addEventListener('click', () => this.setInteractMode('pan'));
    this.paintModeBtn!.addEventListener('click', () => this.setInteractMode('paint'));
    this.toggleLeftPanelBtn!.addEventListener('click', () => this.toggleLeftPanel());
    this.diversitiesBtn!.addEventListener('click', () => {
      diversitiesDialog.show();
    });
    this.histogramBtn!.addEventListener('click', () => {
      histogramDialog.show();
    });

    // Add keyboard controls for speed adjustment and other shortcuts
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields or when dialog is open
      const dialogOverlay = document.querySelector('.dialog-overlay') as HTMLElement;
      if (
        !event.target ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement ||
        (dialogOverlay && dialogOverlay.style.display !== 'none')
      ) {
        return;
      }

      let key = event.key.toLowerCase();
      let isCtrl = event.ctrlKey || event.metaKey;
      let isAlt = event.altKey;

      // Check ^ hotkeys first. Support both Ctrl and Cmd (Mac)
      if (isCtrl && !isAlt) {
        if (key === 'z') {
          event.preventDefault();
          this.undo();
        } else if (key === 'y') {
          event.preventDefault();
          this.redo();
        } else if (key === 'a') {
          // Prevent browser's select all
          event.preventDefault();
        }
        return;
      }

      // Check Alt+^ hotkeys next - internal commands.
      if (isAlt && isCtrl) {
        if (key === 't') {
          event.preventDefault();
          runSpeedTest();
        } else if (key === 'd') {
          event.preventDefault();
          dumpStateInfo();
        } else if (key === 's') {
          event.preventDefault();
          dumpPattern();
        } else if (key === 'r') {
          event.preventDefault();
          gameState.setState({ isContentDirty: true });
        }
        return;
      }

      // Finally simple hotkeys. Ignoree control, alt, and meta keys
      if (isCtrl || isAlt) {
        return;
      }

      if (key === '[') {
        event.preventDefault();
        this.adjustSpeed(-1);
      } else if (key === ']') {
        event.preventDefault();
        this.adjustSpeed(1);
      } else if (key === 'w') {
        event.preventDefault();
        gameState.isWrap = !gameState.isWrap;
        this.refreshStatusLine();
      } else if (key === 'g') {
        event.preventDefault();
        gameState.setState({ showGrid: !gameState.showGrid });
      } else if (key === 'enter') {
        event.preventDefault();
        this.toggleRunning();
      } else if (key === ' ') {
        // Prevent page scrolling
        event.preventDefault();
        if (event.shiftKey) {
          // if shift is pressed, show run N dialog
          runNumDialog.show();
        } else {
          this.runOnce();
        }
      } else if (key === '+' || key === '=') {
        event.preventDefault();
        this.adjustCellSize(1);
      } else if (key === '-') {
        event.preventDefault();
        this.adjustCellSize(-1);
      } else if (key === 'r') {
        event.preventDefault();
        boardState.randomize();
      } else if (key === 'c') {
        event.preventDefault();
        this.clear();
      } else if (key === 'f') {
        event.preventDefault();
        this.setBestFitCellSize();
        this.centerPattern();
      } else if (key === 'p') {
        event.preventDefault();
        this.setInteractMode('pan');
      } else if (key === 'u') {
        event.preventDefault();
        this.showUndoDialog();
      } else if (key === 'd') {
        event.preventDefault();
        this.setInteractMode('paint');
      }
    });

    this.menuBtn!.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.isMenuOpen) {
        this.showMenu();
      } else {
        this.hideMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !this.menuDropdown!.contains(e.target as Node) &&
        !this.menuBtn!.contains(e.target as Node)
      ) {
        this.hideMenu();
      }
    });
  }

  private setupMenuButton() {
    if (!this.menuBtn) return;

    // Create dropdown menu
    this.menuDropdown = document.createElement('div');
    this.menuDropdown.className = 'menu-dropdown';

    // Set initial styles
    this.menuDropdown.style.display = 'none';
    this.menuDropdown.style.position = 'fixed';
    this.menuDropdown.style.zIndex = '1000';

    // Create menu items
    const menuItems = [
      {
        text: 'Save to Clipboard',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-content-save"/></svg>',
        onClick: () => this.saveToClipboard(),
      },
      {
        text: 'Open from Clipboard',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-folder-open"/></svg>',
        onClick: () => this.loadFromClipboard(),
      },
      //
      {
        text: 'Run N',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-alpha-n-circle-outline"/></svg>',
        onClick: () => runNumDialog.show(),
        class: 'mobile-only',
      },
      {
        text: 'Undo',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-undo"/></svg>',
        onClick: () => this.undo(),
        class: 'mobile-only',
      },
      {
        text: 'Undo History',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-menu-down"/></svg>',
        onClick: () => this.showUndoDialog(),
        class: 'mobile-only',
      },
      {
        text: 'Redo',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-redo"/></svg>',
        onClick: () => this.redo(),
        class: 'mobile-only',
      },
      {
        text: 'Rules',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-dna"/></svg>',
        onClick: () => this.showRulesDialog(),
        class: 'mobile-only',
      },
      {
        text: 'Histogram',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-chart-bar"/></svg>',
        onClick: () => histogramDialog.show(),
        class: 'mobile-only',
      },
      {
        text: 'Diversities',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-auto-fix"/></svg>',
        onClick: () => diversitiesDialog.show(),
        class: 'mobile-only',
      },
      //
      {
        text: 'About MCell',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-information-outline"/></svg>',
        onClick: () => aboutDialog.show(),
      },
      {
        text: 'Help',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-help-circle-outline"/></svg>',
        onClick: () => helpDialog.show(),
      },
      {
        text: 'Settings',
        icon: '<svg class="svg-icon"><use href="assets/icons.svg#mdi-cog"/></svg>',
        onClick: () => settingsDialog.show(),
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.className = `menu-item ${item.class || ''}`;
      menuItem.innerHTML = `<span class="menu-icon">${item.icon}</span>${item.text}`;

      // Simpler click handler that just executes the action and hides the menu
      menuItem.addEventListener('click', () => {
        // Execute the action in the next tick to avoid any event handling issues
        setTimeout(() => {
          item.onClick();
          this.hideMenu();
        }, 0);
      });

      this.menuDropdown!.appendChild(menuItem);
    });

    // Add dropdown to DOM right after the menu button
    this.menuBtn.parentNode!.appendChild(this.menuDropdown);

    // Handle menu button clicks
    const handleMenuClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (!this.isMenuOpen) {
        this.showMenu();
      } else {
        this.hideMenu();
      }
    };

    this.menuBtn.addEventListener('click', handleMenuClick);
    this.menuBtn.addEventListener('mousedown', (e) => e.preventDefault());

    // Handle document clicks for closing the menu
    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        if (this.ignoreNextClick) {
          this.ignoreNextClick = false;
          return;
        }

        // Only process if clicking outside menu and button
        if (
          this.isMenuOpen &&
          !this.menuDropdown!.contains(e.target as Node) &&
          !this.menuBtn!.contains(e.target as Node)
        ) {
          this.hideMenu();
        }
      },
      true
    );
  }

  saveToClipboard() {
    savePatternDialog.show(
      gameState.currentFileDescription,
      false,
      false,
      (description, saveSpeed, savePalette) => {
        IOUtils.putPatternOnClipboard(description, saveSpeed, savePalette);
      }
    );
  }

  loadFromClipboard() {
    IOUtils.openPatternFromClipboard((patternData: CaPatternData) => {
      if (patternData && patternData.loadSuccess) {
        this.applyPattern(patternData);
        // Remove highlight from previous active pattern in the pattern browser
        this.removePatternHighlight(this.patternList!);
      }
    });
  }

  private showMenu() {
    if (!this.menuBtn || !this.menuDropdown) {
      console.log('Missing elements:', {
        menuBtn: !this.menuBtn,
        menuDropdown: !this.menuDropdown,
      });
      return;
    }

    const buttonRect = this.menuBtn.getBoundingClientRect();

    // Position the dropdown below the button and align with its right edge
    this.menuDropdown.style.position = 'fixed';
    this.menuDropdown.style.display = 'block';

    // Need to wait for next frame to get correct dimensions
    requestAnimationFrame(() => {
      if (!this.menuDropdown) return;

      const dropdownRect = this.menuDropdown.getBoundingClientRect();
      this.menuDropdown.style.top = `${buttonRect.bottom + 4}px`;
      this.menuDropdown.style.left = `${buttonRect.right - dropdownRect.width}px`;

      // Ensure the dropdown doesn't go off-screen on the left
      if (parseFloat(this.menuDropdown.style.left) < 8) {
        this.menuDropdown.style.left = '8px';
      }
    });

    this.isMenuOpen = true;
    this.ignoreNextClick = true;
  }

  private hideMenu() {
    if (this.menuDropdown) {
      this.menuDropdown.style.display = 'none';
      this.isMenuOpen = false;
    }
  }

  onGameStateChange(state: GameState) {
    // todo: this is expensive during running
    this.refreshStatusLine();
    this.updateStartStopButton();
  }

  updateStartStopButton() {
    // Create or get the <span> for the icon
    let iconSpan = this.startStopBtn!.querySelector('.icon-span') as HTMLSpanElement;
    if (!iconSpan) {
      iconSpan = document.createElement('span');
      iconSpan.classList.add('icon-span');
      this.startStopBtn!.insertBefore(iconSpan, this.startStopBtn!.firstChild);
    }

    // Update the icon by changing the span’s innerHTML
    iconSpan.innerHTML = gameState.isRunning
      ? '<svg class="svg-icon inverse"><use href="assets/icons.svg#mdi-stop"></use></svg>'
      : '<svg class="svg-icon inverse"><use href="assets/icons.svg#mdi-play"></use></svg>';

    // Update tooltip
    this.startStopBtn!.title = `Start/Stop (Enter) - Speed: ${gameState.speed === 0 ? 'Max' : gameState.speed + 'ms'}`;

    // Update indicator width
    this.updateSpeedIndicator();
  }

  toggleRunning() {
    // if about to start, add this state to Undo history
    if (!gameState.isRunning) {
      undoSystem.addItem(UndoSystem.UNDO_EVT_RUN);
      this.updateUndoButtons();
    }

    gameState.setState({ isRunning: !gameState.isRunning });
    this.updateStartStopButton();
  }

  runOnce() {
    if (gameState.isRunning) {
      gameState.setState({ isRunning: false });
      this.updateStartStopButton();
    }

    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_RUN1);

    this.runOneCycle();
  }

  runOneCycle() {
    const wasRunning = gameState.isRunning;
    gameState.setState({ isRunning: false });

    const numOfModifiedCells = this.runOneSilentCycle();

    let gs: Partial<GameState> = {};
    gs.isContentDirty = true;
    if (numOfModifiedCells > 0) {
      if (wasRunning) {
        gs.isRunning = true;
      }
    } else {
      gs.isRunning = false;
    }
    gameState.setState(gs);
  }

  runOneSilentCycle(): number {
    const newLattice = new Lattice(boardState.lattice.width, boardState.lattice.height);

    const divBefore = diversities.perform(true, boardState.lattice, gameState.cycle);

    let numOfModifiedCells: number = gameState.currentEngine.onePass(
      boardState.lattice,
      newLattice,
      gameState
    );

    const divAfter = diversities.perform(false, newLattice, gameState.cycle);

    numOfModifiedCells += (divBefore ? 1 : 0) + (divAfter ? 1 : 0);

    if (numOfModifiedCells > 0) {
      boardState.lattice = newLattice;
      gameState.cycle++;
    }

    return numOfModifiedCells;
  }

  updateSpeed() {
    const speed = parseInt(this.speedBtn!.textContent!);
    gameState.setState({ speed: speed });
  }

  adjustSpeed(direction: number) {
    const speeds = [0, 10, 25, 50, 100, 250, 500, 1000, 5000];
    const currentIndex = speeds.indexOf(gameState.speed);
    const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex - direction));

    if (newIndex !== currentIndex) {
      this.setSpeed(speeds[newIndex]);
    }
  }

  adjustCellSize(delta: number) {
    const currentSize = boardState.cellSize;
    const newSize = Math.max(
      Constants.MIN_CELL_SIZE,
      Math.min(Constants.MAX_CELL_SIZE, currentSize + delta)
    );
    if (newSize !== currentSize) {
      this.setCellSize(newSize);
    }
  }

  async updateFamily(updatePatterns = true) {
    const familyCode = caEngines.getValidFamilyCode(this.familySelect!.value);

    // Don't setState here, it will be set by updateRule
    gameState.currentFamilyCode = familyCode;

    // Populate rule dropdown and ensure it has options
    const hasRules = await this.populateRuleDropdown();
    if (!hasRules) {
      console.error(`No rules found for family ${familyCode}`);
      return;
    }

    // Use the last selected rule for this family if available, otherwise use the first rule
    const lastRule = this.lastSelectedRules.find((rule) => rule.family === familyCode);
    if (
      lastRule &&
      Array.from(this.ruleSelect!.options).some((opt) => opt.value === lastRule.rule)
    ) {
      this.ruleSelect!.value = lastRule.rule;
    } else {
      this.ruleSelect!.selectedIndex = 0;
      // Store the default rule as the last selected one
      this.registerLastSelectedRule(familyCode, this.ruleSelect!.value);
    }

    await this.updateRule(updatePatterns);
  }

  // If the family is not in the lastSelectedRules array, add it, else update the rule
  private registerLastSelectedRule(family: string, rule: string) {
    const index = this.lastSelectedRules.findIndex((r) => r.family === family);
    if (index === -1) {
      this.lastSelectedRules.push({ family, rule });
    } else {
      this.lastSelectedRules[index].rule = rule;
    }
  }

  async updateRule(updatePatterns = true) {
    // Ensure we have a valid selection
    if (this.ruleSelect!.selectedIndex === -1) {
      console.error('No rule selected');
      return;
    }

    const ruleDefinition = this.ruleSelect!.value;

    // Store the selected rule for this family
    this.registerLastSelectedRule(gameState.currentFamilyCode, ruleDefinition);

    gameState.activateRule(gameState.currentFamilyCode, ruleDefinition);

    if (updatePatterns) {
      await this.updatePatternList();
    }
  }

  clear() {
    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_CLR);

    boardState.clear();
  }

  refreshStatusLine() {
    const dims = `${boardState.lattice.width}x${boardState.lattice.height}/${boardState.cellSize}`;
    this.boardSizeDisplay!.textContent = `${dims}${gameState.isWrap ? ' (wrap)' : ''}`;

    this.cycleDisplay!.textContent = `Cycle: ${gameState.cycle}`;

    const f = gameState.currentFamilyCode;
    const r = gameState.currentRuleName;
    let def = gameState.currentRuleDefinition;
    // shorten def to max 23 chars incl. ellipsis
    def = def.length > 23 ? def.substring(0, 20) + '...' : def;
    this.ruleDisplay!.textContent = `${f}/${r} (${def})`;
  }

  addAllfamilies() {
    this.familySelect!.innerHTML = '';
    caEngines.engines.forEach((engine) => {
      const option = document.createElement('option');
      option.value = engine.code;
      option.textContent = engine.code;
      this.familySelect!.appendChild(option);
    });
  }

  async populateFamilyOptions(updatePatterns = true) {
    this.addAllfamilies();
    this.familySelect!.value = gameState.currentFamilyCode;
    await this.updateFamily(updatePatterns); // Only update patterns if requested
  }

  async populateRuleDropdown() {
    const rules = gameState.lexicon.getEntries(gameState.currentFamilyCode);
    this.ruleSelect!.innerHTML = '';
    rules.forEach((rule: CaLexiconEntry) => {
      const option = document.createElement('option');
      option.value = rule.ruleDefinition;
      option.textContent = rule.ruleName;
      this.ruleSelect!.appendChild(option);
    });
    this.ruleSelect!.value = gameState.currentRuleDefinition;
    return rules.length > 0; // Return true if any rules were added
  }

  async addPatternToList(pattern: CaPattern, ul: HTMLDivElement | HTMLUListElement) {
    const li = document.createElement('li');

    const infoIcon = document.createElement('span');
    infoIcon.className = 'info-icon';
    infoIcon.textContent = 'i';
    infoIcon.title = 'View pattern description';
    infoIcon.onclick = async (e) => {
      e.stopPropagation(); // Prevent pattern loading when clicking info
      await this.showPatternDescription(pattern.path);
    };

    const textContainer = document.createElement('div');
    textContainer.className = 'pattern-text-container';
    textContainer.innerHTML = `<div class="pattern-name-line">${pattern.fileName.split('.')[0]}</div><div class="pattern-info-line">${pattern.family}/${pattern.ruleName}</div>`;

    const highlightPattern = async () => {
      // Remove highlight from previously highlighted pattern
      this.removePatternHighlight(ul);
      // Add highlight to this pattern
      li.classList.add('highlighted');

      if (pattern.family) {
        // Must-see pattern case - populate the rule dropdown first but don't update patterns
        await this.populateFamilyOptions(false);
        const familyRules = gameState.lexicon.getEntries(pattern.family);
        if (familyRules && familyRules.length > 0) {
          const rule = familyRules[0];
          await gameState.activateRule(pattern.family, rule.ruleDefinition);
        } else {
          console.error(`No rules found for family ${pattern.family}`);
          return;
        }
      }
      await this.loadPattern(pattern.path);
    };

    textContainer.onclick = function (event) {
      event.stopPropagation();
      highlightPattern();
    };
    li.onclick = highlightPattern;

    li.appendChild(infoIcon);
    li.appendChild(textContainer);
    ul.appendChild(li);
  }

  private removePatternHighlight(ul: HTMLDivElement | HTMLUListElement) {
    const highlighted = ul.querySelector('.highlighted');
    if (highlighted) {
      highlighted.classList.remove('highlighted');
    }
  }

  async showMustSeePatterns() {
    const patterns: CaPattern[] = caPatterns.getMustSeePatterns();
    this.patternList!.innerHTML = '';

    // Hide the pattern browser since we're showing must-see patterns
    this.patternBrowser!.style.display = 'none';

    for (const pattern of patterns) {
      await this.addPatternToList(pattern, this.patternList!);
    }
  }

  async updatePatternList() {
    this.patternList!.innerHTML = '';

    const isMustSee = this.viewModeSelect!.value === 'Must-see rules';
    let patterns: CaPattern[] = [];

    if (isMustSee) {
      patterns = caPatterns.getMustSeePatterns();
    } else {
      // Get patterns for current family/rule
      const family = gameState.currentFamilyCode;
      // Get the rule name instead of the rule definition
      const ruleName = this.ruleSelect!.options[this.ruleSelect!.selectedIndex].text;
      patterns = caPatterns.getPatternsForRule(family, ruleName);

      if (!patterns || patterns.length === 0) {
        console.log(`No patterns found for ${family}/${ruleName}`);
        return;
      }
    }

    // Create UL for pattern list
    const ul: HTMLUListElement = document.createElement('ul');
    ul.className = 'pattern-list';
    patterns.forEach((pattern) => this.addPatternToList(pattern, ul));
    this.patternList!.appendChild(ul);
  }

  async showPatternDescription(patternPath: string) {
    const data = await patternLoader.loadPatternFromFile(patternPath);
    if (!data) return;

    let htmlText = patternLoader.getDescriptionHTML() || 'No description available.';

    patternDescriptionDialog.show(data.fileName, htmlText, data);
  }

  applyPattern(patternData: CaPatternData) {
    // Hide the left panel on mobile devices after pattern selection
    if (this.isMobileDevice() && this.leftPanel!.classList.contains('show')) {
      // console.log('Hiding left panel after pattern selection on mobile');
      this.toggleLeftPanel();
    }

    let paletteChanged: boolean = false;

    // Stop the simulation
    if (gameState.isRunning) {
      gameState.setState({ isRunning: false });
      this.updateStartStopButton();
    }

    // Active selection must be discarded
    boardState.discardSelection();

    // Add current state to Undo history
    undoSystem.addItem(UndoSystem.UNDO_EVT_LOAD);

    // Resize board if needed
    if (patternData.boardSize.width > 0 && patternData.boardSize.height > 0) {
      const newWidth = patternData.boardSize.width;
      const newHeight = patternData.boardSize.height;
      if (newWidth !== boardState.lattice.width || newHeight !== boardState.lattice.height) {
        boardState.resize(newWidth, newHeight);
      }
    }

    // Apply wrap if specified
    if (patternData.wrap !== undefined && patternData.wrap >= 0) {
      gameState.isWrap = patternData.wrap > 0;
    }

    // Apply speed if specified
    if (patternData.speed !== undefined && patternData.speed >= 0) {
      // find the closest speed option
      const speedOptions = [0, 10, 25, 50, 100, 250, 500, 1000, 5000];
      const closestSpeed = speedOptions.reduce((prev, curr) =>
        Math.abs(curr - patternData.speed) < Math.abs(prev - patternData.speed) ? curr : prev
      );
      this.setSpeed(closestSpeed);
    }

    // Apply palette if specified
    if (patternData.palette) {
      // find the palette with the specified name
      const palette = palettes.getPalette(patternData.palette);
      settings.setPaletteName(palette.name);
      paletteChanged = true;
    }

    // Apply the rules if specified
    if (patternData.rules) {
      let familyCode = patternData.family;
      if (!familyCode) {
        familyCode = gameState.currentFamilyCode;
      }
      gameState.activateRule(familyCode, patternData.rules);
    }

    // Activate diversities if specified
    if (patternData.hasDiversities()) {
      diversities.settings.setDefaults();
      patternData.diversities.forEach((div) => {
        diversities.applyConfigString(div);
      });
    } else {
      // disable diversities, preserve previous settings
      diversities.settings.enabled = false;
    }

    // Clear the board
    boardState.clear();
    gameState.currentFileName = patternData.fileName;
    gameState.currentFileDescription = patternData.description;

    // Create the pattern cells
    if (patternData.loadedCells.length) {
      const centerX = Math.floor((boardState.lattice.width - patternData.loadedCells.length) / 2);
      let centerY = Math.floor((boardState.lattice.height - patternData.loadedCells[0].length) / 2);
      if (gameState.currentEngine.universeType === CaEngines.UNIV_TYPE_1D) {
        centerY = 0;
      }

      let liveCellCount = 0;
      for (let x = 0; x < patternData.loadedCells.length; x++) {
        for (let y = 0; y < patternData.loadedCells[0].length; y++) {
          if (patternData.loadedCells[x][y] > 0) {
            boardState.lattice.setCell(centerX + x, centerY + y, patternData.loadedCells[x][y]);
            liveCellCount++;
          }
        }
      }
    }

    // Update the game state
    let st: Partial<GameState> = { isContentDirty: true, cycle: 0 };
    if (paletteChanged) {
      st.isPaletteChanged = true;
    }
    gameState.setState(st);

    // Auto-center the pattern to the viewport
    this.centerPattern();
  }

  async loadPattern(patternPath: string) {
    const patternData: CaPatternData | null = await patternLoader.loadPatternFromFile(patternPath);
    if (!patternData) {
      return;
    }

    this.applyPattern(patternData);
  }

  async setupViewModeSelect() {
    // Store the current family/rule when switching to must-see
    let lastFamily: string = '';
    let lastRule: string = '';

    // Function to update visibility based on view mode
    const updateViewMode = async () => {
      // Wait for initialization if needed
      if (gameState.isInitializing) {
        await new Promise<void>((resolve) => {
          const checkInit = () => {
            if (!gameState.isInitializing) {
              resolve();
            } else {
              setTimeout(checkInit, 100);
            }
          };
          checkInit();
        });
      }

      const isMustSee = this.viewModeSelect!.value === 'Must-see rules';
      this.patternBrowser!.style.display = isMustSee ? 'none' : 'block';

      if (isMustSee) {
        // Store current selections before switching to must-see
        lastFamily = this.familySelect!.value;
        lastRule = this.ruleSelect!.value;
        await this.showMustSeePatterns();
      } else {
        // Restore previous selections if available
        if (lastFamily) {
          this.familySelect!.value = lastFamily;
          // Don't update patterns yet as we'll do it after setting the rule
          await this.updateFamily(false);

          if (lastRule) {
            this.ruleSelect!.value = lastRule;
            // Now update patterns with both family and rule restored
            await this.updateRule(true);
          }
        } else {
          // If no previous selection, just populate family options
          await this.populateFamilyOptions(true);
        }
      }
    };

    // Set initial state
    await updateViewMode();

    // Add event listener for view mode changes
    this.viewModeSelect!.addEventListener('change', updateViewMode);
  }

  setInteractMode(mode: 'pan' | 'paint') {
    gameState.setState({ interactMode: mode });
    if (mode === 'pan') {
      this.panModeBtn!.classList.add('active');
      this.paintModeBtn!.classList.remove('active');
    } else {
      this.panModeBtn!.classList.remove('active');
      this.paintModeBtn!.classList.add('active');
    }
  }

  toggleLeftPanel() {
    this.leftPanel!.classList.toggle('show');
  }

  // Sync the UI with the current family and rule.
  async syncFamilyAndRule() {
    // first make sure "Browse all" is selected
    if (this.viewModeSelect!.value !== 'Browse all') {
      this.viewModeSelect!.value = 'Browse all';
      // make family and rule elements visible
      this.patternBrowser!.style.display = 'block';
      // populate family options
      this.addAllfamilies();
    }

    // activate the chosen family
    this.familySelect!.value = gameState.currentFamilyCode;

    // populate rule options
    this.ruleSelect!.options.length = 0;
    const rules = gameState.lexicon.getEntries(gameState.currentFamilyCode);
    rules.forEach((rule) => {
      const option = document.createElement('option');
      option.value = rule.ruleDefinition;
      option.textContent = rule.ruleName;
      this.ruleSelect!.appendChild(option);
    });

    // select the rule that matches the current rule definition
    const ruleOption = Array.from(this.ruleSelect!.options).find(
      (option) => option.value === gameState.currentRuleDefinition
    );
    if (ruleOption) {
      this.ruleSelect!.value = ruleOption.value;
      // populate pattern list
      this.updatePatternList();
    }
  }

  showRulesDialog() {
    rulesDialog.show(
      gameState.currentFamilyCode,
      gameState.currentRuleDefinition,
      (familyCode, ruleDefinition) => {
        gameState.activateRule(familyCode, ruleDefinition);
        // console.log(`Rules dialog accepted. Family: ${gameState.currentFamilyCode}, Rule: ${gameState.currentRuleDefinition}`);
        this.syncFamilyAndRule();
      }
    );
  }

  setBestFitCellSize() {
    // Get the container dimensions
    const container = document.getElementById('board-container');
    if (!container) {
      throw new Error('Board container not found.');
    }
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Find the actual pattern bounds (ignore empty edges)
    let minX = boardState.lattice.width;
    let maxX = 0;
    let minY = boardState.lattice.height;
    let maxY = 0;
    let hasLiveCells = false;

    for (let y = 0; y < boardState.lattice.height; y++) {
      for (let x = 0; x < boardState.lattice.width; x++) {
        if (boardState.lattice.cells[x][y] > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          hasLiveCells = true;
        }
      }
    }

    if (!hasLiveCells) {
      // If no live cells, fit the entire board
      minX = 0;
      maxX = boardState.lattice.width - 1;
      minY = 0;
      maxY = boardState.lattice.height - 1;
    }

    // Calculate pattern dimensions
    const patternWidth = maxX - minX + 1;
    const patternHeight = maxY - minY + 1;

    // Calculate cell size that would fit the pattern in the container
    // Add some padding (0.9) to not fill the entire space
    const widthBasedSize = Math.floor((containerWidth * 0.9) / patternWidth);
    const heightBasedSize = Math.floor((containerHeight * 0.9) / patternHeight);

    // Use the smaller of the two sizes to ensure pattern fits both dimensions
    let newSize = Math.min(widthBasedSize, heightBasedSize);

    // Enforce minimum and maximum limits
    newSize = Math.max(Constants.MIN_CELL_SIZE, Math.min(Constants.MAX_CELL_SIZE, newSize));

    // Update the cell size
    this.setCellSize(newSize);
  }

  // Scroll the board to show the pattern in the center.
  // The function does not modify the cells in the lattice.
  centerPattern() {
    // Find the actual pattern bounds (ignore empty edges)
    let minX = boardState.lattice.width;
    let maxX = 0;
    let minY = boardState.lattice.height;
    let maxY = 0;
    let hasLiveCells = false;

    for (let y = 0; y < boardState.lattice.height; y++) {
      for (let x = 0; x < boardState.lattice.width; x++) {
        if (boardState.lattice.cells[x][y] > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          hasLiveCells = true;
        }
      }
    }

    if (!hasLiveCells) {
      return;
    }

    // Calculate pattern dimensions
    const patternWidth = maxX - minX + 1;
    const patternHeight = maxY - minY + 1;

    // Scroll the board to show the pattern in the center
    const container: HTMLDivElement = document.getElementById('board-container') as HTMLDivElement;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const cellSize = boardState.cellSize;
    const offsetX = Math.floor((containerWidth - patternWidth * cellSize) / 2);
    const offsetY = Math.floor((containerHeight - patternHeight * cellSize) / 2);

    container.scrollLeft = minX * cellSize - offsetX;
    container.scrollTop = minY * cellSize - offsetY;
  }

  setSpeed(speed: number) {
    gameState.setState({ speed: speed });
    this.updateStartStopButton();
  }

  setCellSize(newSize: number) {
    if (newSize >= Constants.MIN_CELL_SIZE && newSize <= Constants.MAX_CELL_SIZE) {
      boardState.cellSize = newSize;
      gameState.setState({ boardResized: true });
    }
  }

  setBoardSize(width: number, height: number) {
    boardState.resize(width, height);
    this.refreshStatusLine();
  }

  updateSpeedIndicator() {
    const speeds = [0, 10, 25, 50, 100, 250, 500, 1000, 5000];
    const currentIndex = speeds.indexOf(gameState.speed);
    const percentage = ((speeds.length - 1 - currentIndex) / (speeds.length - 1)) * 100;

    if (this.speedIndicator) {
      this.speedIndicator.style.width = `${percentage}%`;
    }

    // Update tooltip
    this.startStopBtn!.title = `Start/Stop (Enter) - Speed: ${currentIndex + 1}/${speeds.length}`;
  }

  /**
   * Undo the last action
   */
  undo() {
    if (gameState.isRunning) {
      gameState.setState({ isRunning: false });
      this.updateStartStopButton();
    }
    undoSystem.undoOne();
    this.updateUndoButtons();
  }

  /**
   * Redo the previously undone action
   */
  redo() {
    if (gameState.isRunning) {
      gameState.setState({ isRunning: false });
      this.updateStartStopButton();
    }
    undoSystem.redoOne();
    this.updateUndoButtons();
  }

  /**
   * Show the undo history dialog
   */
  showUndoDialog() {
    undoDialog.show();
  }

  /**
   * Update the enabled state of undo/redo buttons
   */
  private updateUndoButtons() {
    // todo
    // this.undoBtn!.disabled = undoSystem.pos() <= 0 || undoSystem.size() === 0;
    // this.undoBtn!.disabled = undoSystem.size() === 0;
    // this.redoBtn!.disabled = undoSystem.pos() >= undoSystem.size() - 1;
  }

  private isMobileDevice(): boolean {
    // Check if the toggle button is visible (which only happens on mobile)
    return window.getComputedStyle(this.toggleLeftPanelBtn!).getPropertyValue('display') !== 'none';
  }
}

export const controls = new Controls();
// Initialize() will be called by index.js
