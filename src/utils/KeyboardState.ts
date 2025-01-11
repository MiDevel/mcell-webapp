/**
 * Utility class to track keyboard state globally
 */
export class KeyboardState {
  private static instance: KeyboardState;
  private pressedKeys: Set<string> = new Set();

  private constructor() {
    window.addEventListener('keydown', (e) => {
      //   console.log('KeyDown:', e.key);
      this.pressedKeys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      //   console.log('KeyUp:', e.key);
      this.pressedKeys.delete(e.key);
    });

    // Clear state when window loses focus
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
    });
  }

  public static getInstance(): KeyboardState {
    if (!KeyboardState.instance) {
      KeyboardState.instance = new KeyboardState();
    }
    return KeyboardState.instance;
  }

  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  public isShiftPressed(): boolean {
    return this.pressedKeys.has('Shift');
  }
}

// Initialize the keyboard state tracker
KeyboardState.getInstance();
