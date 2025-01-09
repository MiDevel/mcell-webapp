/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// CaPatterns.js - Handles loading and accessing patterns

// Singleton instance
let instance: CaPatterns | null = null;

export class CaPattern {
  fileName: string;
  path: string;
  family: string;
  ruleName: string;

  constructor(fileName: string, path: string, family: string, ruleName: string) {
    this.fileName = fileName;
    this.path = path;
    this.family = family;
    this.ruleName = ruleName;
  }
}

export class CaPatterns {
  patterns: Map<string, CaPattern[]> = new Map(); // key: family/rule, value: array of patterns
  mustSeePatterns: CaPattern[] = []; // array of must-see patterns

  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;
  }

  static sanitizeName(name: string) {
    // Allowed characters: a-z, A-Z, 0-9, /, -, _, +, &, (, ), ., ', space
    // Replace any non-alphanumeric characters with '_'
    return name.replace(/[^a-zA-Z0-9/+-_&(). ']/g, '_');
  }

  // Extract patterns from text
  getPatternsListFromText(text: string) {
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      const parts = line.split('/');
      if (parts.length >= 3) {
        const family = parts[0];
        const ruleName = parts[1];
        const fileName = parts[parts.length - 1];
        const key = `${family}/${ruleName}`;

        if (!this.patterns.has(key)) {
          this.patterns.set(key, []);
        }
        this.patterns.get(key)!.push({
          family: family,
          ruleName: ruleName,
          fileName: fileName,
          path: line,
        });
      }
    }
    // Debug output
    // console.log("Available pattern categories:");
    // this.patterns.forEach((patterns, key) => {
    //     console.log(`${key}: ${patterns.length} patterns`);
    // });
  }

  // Extract must-see patterns from text
  getMustSeePatternsFromText(text: string) {
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      const parts = line.split('/');
      if (parts.length >= 3) {
        const family = parts[0];
        const ruleName = parts[1];
        const fileName = parts[parts.length - 1];
        this.mustSeePatterns.push({
          family: family,
          ruleName: ruleName,
          fileName: fileName,
          path: line,
        });
      }
    }
  }

  // Get patterns for a specific family and rule
  getPatternsForRule(family: string, ruleName: string) {
    ruleName = CaPatterns.sanitizeName(ruleName);
    const key = `${family}/${ruleName}`;
    const patterns = this.patterns.get(key);
    if (!patterns) {
      console.log(`No patterns found for key: ${key}`);
      // console.log("Available keys:", Array.from(this.patterns.keys()));
    }
    return patterns || [];
  }

  // Get must-see patterns
  getMustSeePatterns() {
    return this.mustSeePatterns;
  }
}

export const caPatterns = new CaPatterns();
