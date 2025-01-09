/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// UndoDialog.js - Dialog for viewing and managing undo history
import { dialog } from './Dialog.js';
import { undoSystem, UndoSystem } from '../core/UndoSystem.js';

export class UndoDialog {
  private dialog: typeof dialog;
  private selectedItem: number | null = null;
  private addStateDisabled: boolean = false;

  constructor() {
    this.dialog = dialog;
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  private truncateFileName(fileName: string, maxLength: number = 20): string {
    if (fileName.length <= maxLength) return fileName;
    const start = fileName.slice(0, maxLength - 3);
    return start + '...';
  }

  private createDialogContent(): string {
    const content = [];
    content.push('<div class="undo-dialog-content">');

    // Create table header
    content.push('<div class="undo-list-container">');
    content.push('<table class="undo-list">');
    content.push('<thead><tr>');
    content.push('<th>#</th>');
    content.push('<th>Event</th>');
    content.push('<th>Pattern</th>');
    content.push('<th>Cycle</th>');
    content.push('<th>Cells</th>');
    content.push('</tr></thead>');
    content.push('<tbody>');

    // Add items
    const currentPos = undoSystem.pos();
    for (let i = 0; i < undoSystem.size(); i++) {
      const item = undoSystem.getItem(i);
      if (!item) continue;

      const isSelected = i === this.selectedItem;
      const isCurrent = i === currentPos;
      const rowClass = [isSelected ? 'selected' : '', isCurrent ? 'current' : '']
        .filter((c) => c)
        .join(' ');

      content.push(`<tr class="${rowClass}" data-index="${i}">`);
      content.push(`<td>${i + 1}${isCurrent ? ' <' : ''}</td>`);
      content.push(`<td>${item.eventType}</td>`);
      content.push(`<td>${this.truncateFileName(item.fileName)}</td>`);
      content.push(`<td>${item.cycle}</td>`);
      content.push(`<td>${item.numAlive}</td>`);
      content.push('</tr>');
    }

    content.push('</tbody></table>');
    content.push('</div>');

    // Item details section
    content.push('<div class="item-details">');
    if (this.selectedItem !== null) {
      const item = undoSystem.getItem(this.selectedItem);
      if (item) {
        content.push('<div class="details-content">');
        content.push('<div class="details-info">');
        content.push(`<span>${this.formatTimestamp(item.timestamp)}</span>`);
        content.push(`<span>${item.width} × ${item.height}</span>`);
        content.push('</div>');
        content.push('<button id="deleteBtn">Delete</button>');
        content.push('<button id="gotoBtn">Go to</button>');
        content.push('</div>');
      }
    } else {
      let message = '';
      if (undoSystem.size() === 0) {
        message = 'Undo history is empty<br/>Check app settings for undo configuration';
      } else {
        message = 'Select an item to access details';
      }
      content.push(`<p class="no-selection">${message}</p>`);
    }
    content.push('</div>');

    // Buttons
    content.push('<div class="dialog-buttons">');
    content.push(
      `<button id="addStateBtn" ${this.addStateDisabled ? 'disabled' : ''}>Add current state</button>`
    );
    content.push('<button id="clearBtn">Clear all</button>');
    content.push('<button id="closeBtn">Close</button>');
    content.push('</div>');

    content.push('</div>');
    return content.join('\n');
  }

  private setupEventListeners() {
    const dialogElement = this.dialog.activeDialog;
    if (!dialogElement) return;

    const listContainer = dialogElement.querySelector('.undo-list-container');
    if (!listContainer) return;

    // Save scroll position before any click
    let savedScrollTop = 0;
    listContainer.addEventListener('scroll', () => {
      savedScrollTop = listContainer.scrollTop;
    });

    const rows = dialogElement.querySelectorAll('.undo-list tbody tr');

    // Track click timing for double-click detection
    let lastClickTime = 0;
    const doubleClickDelay = 200; // milliseconds

    rows.forEach((row, idx) => {
      row.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const timeSinceLastClick = currentTime - lastClickTime;

        if (timeSinceLastClick < doubleClickDelay) {
          // This is a double-click
          const index = parseInt(row.getAttribute('data-index') || '-1');
          if (index >= 0) {
            undoSystem.restoreAt(index);
            this.dialog.close();
          }
        } else {
          // This is a single click - wait briefly before processing
          setTimeout(() => {
            const timeSinceThisClick = new Date().getTime() - currentTime;
            if (timeSinceThisClick >= doubleClickDelay) {
              // No double-click occurred, safe to process single click
              const index = parseInt(row.getAttribute('data-index') || '-1');
              if (index >= 0) {
                this.selectedItem = index;
                this.dialog.setContent(this.createDialogContent());

                // Restore scroll position after content update
                requestAnimationFrame(() => {
                  const newListContainer =
                    this.dialog.activeDialog?.querySelector('.undo-list-container');
                  if (newListContainer) {
                    newListContainer.scrollTop = savedScrollTop;
                  }
                });

                this.setupEventListeners();
              }
            }
          }, doubleClickDelay);
        }

        lastClickTime = currentTime;
      });
    });

    // Handle buttons
    const gotoBtn = dialogElement.querySelector('#gotoBtn');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', () => {
        if (this.selectedItem !== null) {
          undoSystem.restoreAt(this.selectedItem);
          this.dialog.close();
        }
      });
    }

    const deleteBtn = dialogElement.querySelector('#deleteBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.selectedItem !== null) {
          if (undoSystem.deleteAt(this.selectedItem)) {
            this.selectedItem = null;
            this.dialog.setContent(this.createDialogContent());
            this.setupEventListeners();
          }
        }
      });
    }

    const clearBtn = dialogElement.querySelector('#clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the undo history?')) {
          undoSystem.clearAll();
          this.selectedItem = null;
          this.dialog.close();
        }
      });
    }

    const addStateBtn = dialogElement.querySelector('#addStateBtn');
    if (addStateBtn) {
      addStateBtn.addEventListener('click', () => {
        undoSystem.addItem(UndoSystem.UNDO_EVT_USER);
        this.addStateDisabled = true;
        this.dialog.setContent(this.createDialogContent());
        this.setupEventListeners();
      });
    }

    const closeBtn = dialogElement.querySelector('#closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.dialog.close());
    }
  }

  show() {
    this.selectedItem = null;
    this.addStateDisabled = false;
    const content = this.createDialogContent();
    this.dialog.show('Undo History', content);
    this.setupEventListeners();
  }
}

// Export singleton instance
export const undoDialog = new UndoDialog();
