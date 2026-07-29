export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private readonly justPressedKeys = new Set<string>();
  private readonly mousePosition = { x: 0, y: 0 };
  private readonly mouseButtons = new Set<string>();
  private readonly justPressedMouseButtons = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const key = this.normalizeKey(event);

    if (key === "space") {
      event.preventDefault();
    }

    if (!this.pressedKeys.has(key)) {
      this.justPressedKeys.add(key);
    }

    this.pressedKeys.add(key);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = this.normalizeKey(event);

    this.pressedKeys.delete(key);
  };

  private handleBlur = () => {
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
    this.mouseButtons.clear();
    this.justPressedMouseButtons.clear();
  };

  private handleMouseMove = (event: MouseEvent) => {
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  };

  private handleMouseDown = (event: MouseEvent) => {
    const button = this.normalizeMouseButton(event.button);

    if (!this.mouseButtons.has(button)) {
      this.justPressedMouseButtons.add(button);
    }

    this.mouseButtons.add(button);
  };

  private handleMouseUp = (event: MouseEvent) => {
    const button = this.normalizeMouseButton(event.button);

    this.mouseButtons.delete(button);
  };

  public isPressed(...keys: string[]) {
    const normalizedKeys = keys.map((key) => this.normalizeInputKey(key));

    return normalizedKeys.some((key) => this.pressedKeys.has(key));
  }

  public wasPressed(...keys: string[]) {
    const normalizedKeys = keys.map((key) => this.normalizeInputKey(key));

    return normalizedKeys.some((key) => this.justPressedKeys.has(key));
  }

  public isMousePressed(button: "left" | "middle" | "right") {
    return this.mouseButtons.has(button);
  }

  public wasMousePressed(button: "left" | "middle" | "right") {
    return this.justPressedMouseButtons.has(button);
  }

  public getMousePosition() {
    return { ...this.mousePosition };
  }

  private normalizeKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    if (key === " " || key === "spacebar" || code === "space") {
      return "space";
    }

    return key;
  }

  private normalizeInputKey(key: string) {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey === " " || normalizedKey === "spacebar" || normalizedKey === "space") {
      return "space";
    }

    return normalizedKey;
  }

  public update() {
    this.justPressedKeys.clear();
    this.justPressedMouseButtons.clear();
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);

    this.pressedKeys.clear();
    this.justPressedKeys.clear();
    this.mouseButtons.clear();
    this.justPressedMouseButtons.clear();
  }

  private normalizeMouseButton(button: number) {
    if (button === 0) {
      return "left";
    }

    if (button === 1) {
      return "middle";
    }

    return "right";
  }
}
