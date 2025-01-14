/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Dialog.js
export interface TDialog {
  activeDialog: HTMLElement | null;
  show: (title: string, content: string, data?: any) => void;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  close: () => void;
}

export class Dialog implements TDialog {
  activeDialog: HTMLElement | null;
  private dialogTitle: string;

  constructor() {
    this.activeDialog = null;
    this.dialogTitle = '';
    this.setupDialog();
  }

  setupDialog() {
    // Create reusable dialog elements
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.style.display = 'none';
    dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h2></h2>
                    <button class="close-button">×</button>
                </div>
                <div class="dialog-content">
                </div>
            </div>
        `;

    // Add event listeners
    const closeBtn = dialog.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.close();
      }
    });

    // Add to document
    document.body.appendChild(dialog);
    this.activeDialog = dialog;
  }

  show(title: string, content: string, data: any = null) {
    if (!this.activeDialog) return;

    this.dialogTitle = title;
    this.setTitle(title);
    this.setContent(content);
    this.activeDialog.style.display = 'flex';
  }

  setContent(content: string) {
    if (!this.activeDialog) return;

    const contentDiv = this.activeDialog.querySelector('.dialog-content');
    if (contentDiv) {
      contentDiv.innerHTML = content;
    }
  }

  setTitle(title: string) {
    if (!this.activeDialog) return;

    const titleElement = this.activeDialog.querySelector('.dialog-header h2');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  close() {
    if (this.activeDialog) {
      this.activeDialog.style.display = 'none';
    }
  }
}

export const dialog = new Dialog();
