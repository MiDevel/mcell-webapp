/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// StringBuilder.js - Handles building strings
export class StringBuilder {
  private strings: string[] = [];

  append(str: string): StringBuilder {
    if (str && str.length > 0) this.strings.push(str);
    return this;
  }

  clear(): void {
    this.strings = [];
  }

  toString(): string {
    return this.strings.join('');
  }
}
