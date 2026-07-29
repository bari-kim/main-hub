import type { Container } from "pixi.js";

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

const CAMERA_SMOOTHING = 0.12;

export class Camera {
  private viewport: Size;
  private world: Size;
  private position: Point = { x: 0, y: 0 };
  private target: Point = { x: 0, y: 0 };

  constructor(viewport: Size, world: Size) {
    this.viewport = viewport;
    this.world = world;
  }

  public resize(viewport: Size, world: Size) {
    this.viewport = viewport;
    this.world = world;
    this.target = this.clamp(this.target);
    this.position = this.clamp(this.position);
  }

  public follow(target: Point) {
    this.target = this.clamp({
      x: target.x - this.viewport.width / 2,
      y: target.y - this.viewport.height / 2,
    });
  }

  public update() {
    this.position.x += (this.target.x - this.position.x) * CAMERA_SMOOTHING;
    this.position.y += (this.target.y - this.position.y) * CAMERA_SMOOTHING;

    this.position = this.clamp(this.position);
  }

  public applyTo(container: Container) {
    container.position.set(-this.position.x, -this.position.y);
  }

  private clamp(position: Point): Point {
    return {
      x: this.clampAxis(position.x, this.world.width, this.viewport.width),
      y: this.clampAxis(position.y, this.world.height, this.viewport.height),
    };
  }

  private clampAxis(value: number, worldSize: number, viewportSize: number) {
    if (worldSize <= viewportSize) {
      return 0;
    }

    return Math.max(0, Math.min(value, worldSize - viewportSize));
  }
}
