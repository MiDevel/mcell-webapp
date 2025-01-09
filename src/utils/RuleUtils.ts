/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// RuleUtils.js - Utility functions for working with CA rules
export class RuleUtils {
  // Convert strings like "b357/s24" or "s24/b357" to "24/357"
  static normalizeLifeRuleSyntax(ruleDefinition: string): string {
    let def = ruleDefinition.toLowerCase();
    if (def[0] === 's' || def[0] === 'b') {
      const tokens2 = def.split('/');
      if (tokens2.length !== 2) {
        console.log('Invalid Life rule format, s/b expected');
        return '/';
      }

      let survive = '';
      let birth = '';
      if (tokens2[0][0] === 's') {
        survive = tokens2[0].slice(1);
        birth = tokens2[1].slice(1);
      } else {
        survive = tokens2[1].slice(1);
        birth = tokens2[0].slice(1);
      }

      def = `${survive}/${birth}`;
    }

    return def;
  }
}
