import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import {
  PLAYER_HITBOX,
  PLAYER_SPEED,
} from "../../../assets/characters/config";
import type { InputManager } from "../../input/InputManager";

export const PLAYER_VIEWPORT_HEIGHT_RATIO = 0.4;

const PLAYER_VISUAL_WIDTH = 439;
const PLAYER_VISUAL_HEIGHT = 734;

type PlayerDirection = "left" | "right";

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class Player extends Container {
  private readonly visualRoot = new Container();
  private readonly character: Container;
  private visualScale = 1;

  private direction: PlayerDirection = "right";

  private constructor(texture: Texture | null) {
    super();

    this.character = this.createCharacter(texture);
    this.visualRoot.addChild(this.character);
    this.addChild(this.visualRoot);
  }

  public static async create() {
    try {
      const texture = Assets.get<Texture | undefined>("playerWalkRight");

      if (!texture) {
        return new Player(null);
      }

      if (texture.source) {
        texture.source.scaleMode = "nearest";
      }

      return new Player(texture);
    } catch (error) {
      console.error("Failed to load player texture", error);

      return new Player(null);
    }
  }

  private createCharacter(texture: Texture | null): Container {
    if (!texture) {
      return this.createFallbackCharacter();
    }

    const character = new Sprite(texture);

    character.anchor.set(0.5, 1);

    return character;
  }

  private createFallbackCharacter() {
    const character = new Graphics();

    character.roundRect(
      -PLAYER_VISUAL_WIDTH / 2,
      -PLAYER_VISUAL_HEIGHT,
      PLAYER_VISUAL_WIDTH,
      PLAYER_VISUAL_HEIGHT,
      24,
    );
    character.fill("#f2c4c4");

    return character;
  }

  public resizeForViewport(viewportHeight: number) {
    const targetDisplayHeight = viewportHeight * PLAYER_VIEWPORT_HEIGHT_RATIO;

    this.visualScale = targetDisplayHeight / PLAYER_VISUAL_HEIGHT;
    this.applyVisualScale();
  }

  private applyVisualScale() {
    this.visualRoot.scale.set(
      this.visualScale * (this.direction === "right" ? 1 : -1),
      this.visualScale,
    );
  }

  public update(
    deltaTime: number,
    input: InputManager,
    worldWidth: number,
  ) {
    const movementDistance = PLAYER_SPEED * (deltaTime / 60);
    const previousX = this.x;

    if (input.isPressed("a", "arrowleft")) {
      this.x -= movementDistance;
      this.setDirection("left");
    }

    if (input.isPressed("d", "arrowright")) {
      this.x += movementDistance;
      this.setDirection("right");
    }

    this.keepVisualInsideWorld(worldWidth);

    return this.x !== previousX;
  }

  private setDirection(direction: PlayerDirection) {
    if (this.direction === direction) {
      return;
    }

    this.direction = direction;
    this.applyVisualScale();
  }

  public keepInsideWorld(worldWidth: number) {
    const collisionBounds = this.getCollisionBounds();

    const minimumX = -collisionBounds.x;
    const maximumX = worldWidth - collisionBounds.width - collisionBounds.x;

    this.x = Math.max(minimumX, Math.min(this.x, maximumX));
  }

  public keepVisualInsideWorld(worldWidth: number) {
    const visualBounds = this.getVisualBounds();

    const minimumX = -visualBounds.x;
    const maximumX = worldWidth - visualBounds.width - visualBounds.x;

    this.x = Math.max(minimumX, Math.min(this.x, maximumX));
  }

  public getDisplayWidth() {
    return PLAYER_VISUAL_WIDTH * this.visualScale;
  }

  public getDisplayHeight() {
    return PLAYER_VISUAL_HEIGHT * this.visualScale;
  }

  public getVisualBounds(): Bounds {
    return {
      x: -this.getDisplayWidth() / 2,
      y: -this.getDisplayHeight(),
      width: this.getDisplayWidth(),
      height: this.getDisplayHeight(),
    };
  }

  public getCollisionBounds(): Bounds {
    return {
      x: -PLAYER_HITBOX.width / 2,
      y: -PLAYER_HITBOX.height,
      width: PLAYER_HITBOX.width,
      height: PLAYER_HITBOX.height,
    };
  }

  public getInteractionOrigin() {
    return { x: this.x, y: this.y - PLAYER_HITBOX.height / 2 };
  }

  public getCameraTarget() {
    return { x: this.x, y: this.y - this.getDisplayHeight() * 0.45 };
  }

  public getSortAnchor() {
    return { x: this.x, y: this.y };
  }

  public getDirection() {
    return this.direction;
  }
}
