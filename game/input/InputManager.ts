export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private readonly justPressedKeys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (!this.pressedKeys.has(key)) {
      this.justPressedKeys.add(key);
    }

    this.pressedKeys.add(key);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    this.pressedKeys.delete(key);
  };

  private handleBlur = () => {
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
  };

  public isPressed(...keys: string[]) {
    return keys.some((key) => this.pressedKeys.has(key.toLowerCase()));
  }

  public wasPressed(...keys: string[]) {
    return keys.some((key) => this.justPressedKeys.has(key.toLowerCase()));
  }

  public update() {
    this.justPressedKeys.clear();
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);

    this.pressedKeys.clear();
    this.justPressedKeys.clear();
  }
}