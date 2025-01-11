/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// HelpDialog.js
import { dialog, TDialog } from './Dialog.js';
import { Constants } from '../utils/Constants.js';

export class HelpDialog {
  dialog: TDialog;

  constructor() {
    this.dialog = dialog;
  }

  createDialogContent(): string {
    return `
            <div class="help-content" style="max-height: 80vh; overflow-y: auto;">
                <h3>Controls</h3>
                <ul>
                    <li><strong>Enter</strong> - Start/Stop simulation</li>
                    <li><strong>Space</strong> - Run one generation</li>
                    <li><strong>Shift+Space</strong> - Show 'Run N generations' dialog</li>
                    <li><strong>[ / ]</strong> - Increase/Decrease speed</li>
                    <li><strong>+ / &ndash;</strong> - Increase/Decrease cell size</li>
                    <li><strong>W</strong> - Toggle edge wrapping</li>
                    <li><strong>G</strong> - Toggle grid display</li>
                    <li><strong>F</strong> - Best fit pattern</li>
                    <li><strong>C</strong> - Clear board</li>
                    <li><strong>R</strong> - Randomize board</li>
                    <li><strong>^Z / ^Y</strong> - Undo/Redo</li>
                    <li><strong>P / D</strong> - Pan/Draw mode</li>
                </ul>
                <h3>Draw mode</h3>
                <ul>
                    <li><strong>Click/drag</strong> - Draw using current tool and state (color)</li>
                    <li><strong>Shift pressed</strong> - Draw constrained shapes (squares, circles)</li>
                    <li><strong>Ctrl pressed</strong> - Draw from the center</li>
                    <li><strong>0-9</strong> - Select state for painting</li>
                    <li><strong>&lt; / &gt; or , / .</strong> - Previous/Next state for painting</li>
                    <li><strong>^C / ^V</strong> - Copy/Paste selected cells</li>
                    <li><strong>Esc</strong> - interrupt current drawing action</li>
                </ul>
                <h3>Paint tools</h3>
                <ul>
                    <li><strong>A</strong> - Pencil</li>
                    <li><strong>L</strong> - Line</li>
                    <li><strong>B</strong> - Box/Rectangle</li>
                    <li><strong>Shift+B</strong> - Filled Box/Rectangle</li>
                    <li><strong>O</strong> - Oval/Circle</li>
                    <li><strong>Shift+O</strong> - Filled Oval/Circle</li>
                    <li><strong>S</strong> - Select</li>
                    <li><strong>Delete</strong> - Erase selection</li>
                    <li><strong>Shift+Delete</strong> - Erase cells outside selection</li>
                    <li><strong>X</strong> - Flip selection Horizontally</li>
                    <li><strong>Y</strong> - Flip selection Vertically</li>
                    <li><strong>N / M</strong> - Rotate selection Left/Right</li>
                    <li><strong>I</strong> - Invert selection</li>
                    <li><strong>Arrow Keys</strong> - Move selection (with Shift: 5 cells, Ctrl: 10 cells, Both: 20 cells)</li>
                </ul>
            </div>
        `;
  }

  show() {
    this.dialog.show(`MCell v.${Constants.VERSION}`, this.createDialogContent());
  }
}

export const helpDialog = new HelpDialog();
