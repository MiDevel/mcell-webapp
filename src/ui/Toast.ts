/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// Toast.js - Simple toast notification system
export class Toast {
  private static container: HTMLDivElement | null = null;

  private static createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  static show(message: string, duration: number = 2000) {
    this.createContainer();

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    this.container!.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
        // Remove container if it's empty
        if (this.container && !this.container.hasChildNodes()) {
          this.container.remove();
          this.container = null;
        }
      });
    }, duration);
  }
}
