import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import {
  PLAYER_HITBOX,
  PLAYER_SPEED,
} from "./config";
import type { InputManager } from "../../input/InputManager";

export const PLAYER_VIEWPORT_HEIGHT_RATIO = 0.4;

const PLAYER_VISUAL_WIDTH = 64;
const PLAYER_VISUAL_HEIGHT = 64;
const PLAYER_JUMP_GRAVITY = 2400;
const PLAYER_JUMP_APEX_RATIO = 0.5;
const PLAYER_GROUND_EPSILON = 0.5;
const PLAYER_AIR_CONTROL_MULTIPLIER = 1;
const FOOTSTEPS_LOOP_SRC = "/game-assets/sound/footsteps.wav";

// walk_right_13frames.png is a 4x4 grid of 64x64 cells (13 used, 3 empty).
// Frame 0 (top-left) is the idle pose; frames 1-12 are the walk-right cycle.
const PLAYER_SHEET_COLUMNS = 4;
const PLAYER_SHEET_FRAME_COUNT = 13;
const PLAYER_WALK_FRAME_DURATION = 0.09;

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
  private readonly characterSprite: Sprite | null;
  private readonly idleTexture: Texture | null;
  private readonly walkTextures: Texture[];
  private visualScale = 1;

  private direction: PlayerDirection = "right";
  private groundY = 0;
  private verticalVelocity = 0;
  private inputEnabled = true;
  private footstepsAudio: HTMLAudioElement | null = null;
  private walkFrameIndex = 0;
  private walkFrameTimer = 0;

  private constructor(sheetTexture: Texture | null) {
    super();

    if (sheetTexture) {
      const { idle, walk } = this.sliceWalkSheet(sheetTexture);

      this.idleTexture = idle;
      this.walkTextures = walk;

      const sprite = new Sprite(idle);
      sprite.anchor.set(0.5, 1);

      this.character = sprite;
      this.characterSprite = sprite;
    } else {
      this.idleTexture = null;
      this.walkTextures = [];
      this.character = this.createFallbackCharacter();
      this.characterSprite = null;
    }

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

  private sliceWalkSheet(sheetTexture: Texture) {
    const frames: Texture[] = [];

    for (let index = 0; index < PLAYER_SHEET_FRAME_COUNT; index += 1) {
      const column = index % PLAYER_SHEET_COLUMNS;
      const row = Math.floor(index / PLAYER_SHEET_COLUMNS);

      frames.push(
        new Texture({
          source: sheetTexture.source,
          frame: new Rectangle(
            column * PLAYER_VISUAL_WIDTH,
            row * PLAYER_VISUAL_HEIGHT,
            PLAYER_VISUAL_WIDTH,
            PLAYER_VISUAL_HEIGHT,
          ),
        }),
      );
    }

    return { idle: frames[0], walk: frames.slice(1) };
  }

  private createFallbackCharacter() {
    const character = new Graphics();

    character.roundRect(
      -PLAYER_VISUAL_WIDTH / 2,
      -PLAYER_VISUAL_HEIGHT,
      PLAYER_VISUAL_WIDTH,
      PLAYER_VISUAL_HEIGHT,
      10,
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
    groundY: number,
  ) {
    if (!this.inputEnabled) {
      this.groundY = groundY;
      this.y = groundY;
      this.verticalVelocity = 0;
      this.stopFootsteps();
      this.stopWalkAnimation();
      return false;
    }

    const deltaSeconds = deltaTime / 60;
    const previousX = this.x;
    const movementDistance = this.getHorizontalMovementDistance(deltaSeconds);

    this.groundY = groundY;

    if (input.isPressed("a", "arrowleft")) {
      this.x -= movementDistance;
      this.setDirection("left");
    }

    if (input.isPressed("d", "arrowright")) {
      this.x += movementDistance;
      this.setDirection("right");
    }

    if (input.wasPressed("space") && this.isGrounded()) {
      this.verticalVelocity = -this.getJumpVelocity();
    }

    this.verticalVelocity += PLAYER_JUMP_GRAVITY * deltaSeconds;
    this.y += this.verticalVelocity * deltaSeconds;

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.verticalVelocity = 0;
    }

    this.keepVisualInsideWorld(worldWidth);

    const didMoveHorizontally = this.x !== previousX;

    if (didMoveHorizontally) {
      this.startFootsteps();
    } else {
      this.stopFootsteps();
    }

    this.updateWalkAnimation(deltaSeconds, didMoveHorizontally && this.isGrounded());

    return didMoveHorizontally;
  }

  private updateWalkAnimation(deltaSeconds: number, isWalking: boolean) {
    if (!this.characterSprite || this.walkTextures.length === 0) {
      return;
    }

    if (!isWalking) {
      this.stopWalkAnimation();
      return;
    }

    this.walkFrameTimer += deltaSeconds;

    while (this.walkFrameTimer >= PLAYER_WALK_FRAME_DURATION) {
      this.walkFrameTimer -= PLAYER_WALK_FRAME_DURATION;
      this.walkFrameIndex = (this.walkFrameIndex + 1) % this.walkTextures.length;
    }

    this.characterSprite.texture = this.walkTextures[this.walkFrameIndex];
  }

  private stopWalkAnimation() {
    if (!this.characterSprite || !this.idleTexture) {
      return;
    }

    this.walkFrameIndex = 0;
    this.walkFrameTimer = 0;
    this.characterSprite.texture = this.idleTexture;
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

  public setGroundY(groundY: number) {
    this.groundY = groundY;

    if (this.isGrounded()) {
      this.y = groundY;
      this.verticalVelocity = 0;
    }
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

  public setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;

    if (!enabled) {
      this.stopFootsteps();
    }
  }

  public destroy() {
    this.stopFootsteps();
    super.destroy();
  }

  private isGrounded() {
    return Math.abs(this.y - this.groundY) <= PLAYER_GROUND_EPSILON;
  }

  private getJumpVelocity() {
    const targetJumpHeight =
      this.getDisplayHeight() * PLAYER_JUMP_APEX_RATIO;

    return Math.sqrt(2 * PLAYER_JUMP_GRAVITY * targetJumpHeight);
  }

  private getHorizontalMovementDistance(deltaSeconds: number) {
    const airControlMultiplier = this.isGrounded()
      ? 1
      : PLAYER_AIR_CONTROL_MULTIPLIER;

    return PLAYER_SPEED * deltaSeconds * airControlMultiplier;
  }

  private startFootsteps() {
    if (this.footstepsAudio) {
      return;
    }

    try {
      const audio = new Audio(FOOTSTEPS_LOOP_SRC);
      audio.loop = true;
      audio.volume = 0.45;
      audio.preload = "auto";
      void audio.play().catch(() => {
        // Ignore autoplay restrictions.
      });
      this.footstepsAudio = audio;
    } catch {
      this.footstepsAudio = null;
    }
  }

  private stopFootsteps() {
    if (!this.footstepsAudio) {
      return;
    }

    this.footstepsAudio.pause();
    this.footstepsAudio.currentTime = 0;
    this.footstepsAudio = null;
  }
}
