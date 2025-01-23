/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Settings.js - Manages application settings
import { Constants } from '../utils/Constants.js';
import { UndoSystem } from './UndoSystem.js';

interface UndoSettings {
  enabled: boolean;
  maxItems: number;
  enabledEvents: string[];
}

interface UISettings {
  theme: 'dark' | 'light';
  palette: string;
  fullScreenOnHideUI: boolean;
}

interface GeneralSettings {}

interface PatternSettings {
  useDefaultPalette: boolean;
  defaultPalette: string;
  useDefaultSpeed: boolean;
  defaultSpeed: number;
  defaultSizeMargin: number;
}

interface AppSettings {
  ui: UISettings;
  general: GeneralSettings;
  undo: UndoSettings;
  patterns: PatternSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  ui: {
    theme: 'dark',
    palette: 'MCell',
    fullScreenOnHideUI: false,
  },
  general: {},
  patterns: {
    useDefaultPalette: true,
    defaultPalette: 'MCell',
    useDefaultSpeed: true,
    defaultSpeed: 50,
    defaultSizeMargin: 80,
  },
  undo: {
    enabled: true,
    maxItems: 100,
    // LOAD, RUN1 and RULE events are by default not enabled
    // USER events are always enabled
    enabledEvents: [
      UndoSystem.UNDO_EVT_EDIT,
      UndoSystem.UNDO_EVT_CLR,
      UndoSystem.UNDO_EVT_RUN,
      UndoSystem.UNDO_EVT_RUNN,
      UndoSystem.UNDO_EVT_RAND,
      UndoSystem.UNDO_EVT_SEED,
      UndoSystem.UNDO_EVT_SIZE,
    ],
  },
};

export class Settings {
  private static readonly STORAGE_KEY = 'mcell-settings';
  private settings: AppSettings;

  constructor() {
    this.settings = this.loadSettings();
    // Apply last theme
    document.documentElement.setAttribute('data-theme', this.settings.ui.theme);
  }

  private loadSettings(): AppSettings {
    const savedSettings = localStorage.getItem(Settings.STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        return this.mergeWithDefaults(parsed);
      } catch (e) {
        console.error('Failed to parse settings:', e);
        return { ...DEFAULT_SETTINGS };
      }
    }
    return { ...DEFAULT_SETTINGS };
  }

  private mergeWithDefaults(saved: Partial<AppSettings>): AppSettings {
    return {
      ui: { ...DEFAULT_SETTINGS.ui, ...saved.ui },
      general: { ...DEFAULT_SETTINGS.general, ...saved.general },
      patterns: { ...DEFAULT_SETTINGS.patterns, ...saved.patterns },
      undo: { ...DEFAULT_SETTINGS.undo, ...saved.undo },
    };
  }

  public save(): void {
    localStorage.setItem(Settings.STORAGE_KEY, JSON.stringify(this.settings));
  }

  // UI Settings
  public getTheme(): string {
    return this.settings.ui.theme;
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.settings.ui.theme = theme;
    this.save();
  }

  public getPaletteName(): string {
    return this.settings.ui.palette;
  }

  public setPaletteName(paletteName: string): void {
    this.settings.ui.palette = paletteName;
    this.save();
  }

  public isFullScreenOnHideUI(): boolean {
    return this.settings.ui.fullScreenOnHideUI;
  }

  public setFullScreenOnHideUI(fullScreenOnHideUI: boolean): void {
    this.settings.ui.fullScreenOnHideUI = fullScreenOnHideUI;
    this.save();
  }

  // General Settings
  // Pattern Default Settings
  public getPatternDefaults(): PatternSettings {
    return { ...this.settings.patterns };
  }

  public setPatternDefaults(settings: Partial<PatternSettings>): void {
    this.settings.patterns = { ...this.settings.patterns, ...settings };
    this.save();
  }

  // Undo Settings
  public isUndoEnabled(): boolean {
    return this.settings.undo.enabled;
  }

  public setUndoEnabled(enabled: boolean): void {
    this.settings.undo.enabled = enabled;
    this.save();
  }

  public getMaxUndoItems(): number {
    return this.settings.undo.maxItems;
  }

  public setMaxUndoItems(maxItems: number): void {
    this.settings.undo.maxItems = Math.min(maxItems, Constants.MAX_UNDO_ITEMS);
    this.save();
  }

  public isUndoEventEnabled(event: string): boolean {
    // User events are always enabled
    if (event === UndoSystem.UNDO_EVT_USER) return true;

    // Undo the last action must always be enabled
    if (event === UndoSystem.UNDO_EVT_UNDO) return true;

    return this.settings.undo.enabledEvents.includes(event);
  }

  public enableUndoEvent(event: string): void {
    if (!this.settings.undo.enabledEvents.includes(event)) {
      this.settings.undo.enabledEvents.push(event);
      this.save();
    }
  }

  public disableUndoEvent(event: string): void {
    const index = this.settings.undo.enabledEvents.indexOf(event);
    if (index !== -1) {
      this.settings.undo.enabledEvents.splice(index, 1);
      this.save();
    }
  }

  // Get raw settings (for debugging)
  public getAllSettings(): AppSettings {
    return { ...this.settings };
  }
}

// Export singleton instance
export const settings = new Settings();
