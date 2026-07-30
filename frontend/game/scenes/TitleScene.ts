import {
  AnimatedSprite,
  Assets,
  Container,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture,
  type DestroyOptions,
} from "pixi.js";

const DOOR_FRAME_COUNT = 5;
const DOOR_ANIMATION_SECONDS = 0.8;
const TITLE_BACKGROUND_COLOR = 0x080808;
const PRESS_ENTER_TEXT = "PRESS ENTER";
const PRESS_ENTER_COLOR = 0xf6f0df;
const PRESS_ENTER_FALLBACK_FONT = "monospace";
const TITLE_FONT_FAMILY = "DungGeunMo";
const PRESS_ENTER_BLINK_INTERVAL_MS = 650;
const PRESS_ENTER_BOTTOM_MARGIN_RATIO = 0.055;
const PRESS_ENTER_GAP_RATIO = 0.08;

type TitleState = "waiting" | "opening-door" | "opened";

export class TitleScene extends Container {
  private readonly onDoorOpenStart?: () => void;
  private readonly onDoorOpenComplete?: () => void;
  private readonly background: Sprite;
  private readonly door: AnimatedSprite;
  private readonly pressEnter: Text;
  private readonly doorFrames: Texture[];

  private state: TitleState = "waiting";
  private inputBound = false;
  private isDestroyed = false;
  private blinkTimer: number | null = null;

  constructor(
    onDoorOpenStart?: () => void,
    onDoorOpenComplete?: () => void,
  ) {
    super();

    this.onDoorOpenStart = onDoorOpenStart;
    this.onDoorOpenComplete = onDoorOpenComplete;
    this.background = this.createBackground();
    this.doorFrames = this.createDoorFrames();
    this.door = this.createDoor();
    this.pressEnter = this.createPressEnter();

    this.addChild(this.background, this.door, this.pressEnter);
  }

  public bindInput() {
    if (this.inputBound || this.isDestroyed) {
      return;
    }

    window.addEventListener("keydown", this.handleInput);
    window.addEventListener("mousedown", this.handleInput);
    window.addEventListener("pointerdown", this.handleInput);
    window.addEventListener("touchstart", this.handleInput, { passive: true });
    this.inputBound = true;
  }

  public unbindInput() {
    if (!this.inputBound) {
      return;
    }

    window.removeEventListener("keydown", this.handleInput);
    window.removeEventListener("mousedown", this.handleInput);
    window.removeEventListener("pointerdown", this.handleInput);
    window.removeEventListener("touchstart", this.handleInput);
    this.inputBound = false;
  }

  public openDoor() {
    if (this.state !== "waiting") {
      return;
    }

    this.state = "opening-door";
    this.pressEnter.visible = false;
    this.stopBlink();
    this.onDoorOpenStart?.();
    this.door.loop = false;
    this.door.gotoAndPlay(0);
  }

  public isWaiting() {
    return this.state === "waiting";
  }

  public resize(viewportWidth: number, viewportHeight: number) {
    this.background.width = viewportWidth;
    this.background.height = viewportHeight;
    this.background.position.set(0, 0);

    const naturalDoorFrame = this.doorFrames[0];
    const targetHeight = viewportHeight * 0.8;
    const maxWidth = viewportWidth * 0.9;
    const scaleByHeight = targetHeight / naturalDoorFrame.height;
    const scaleByWidth = maxWidth / naturalDoorFrame.width;
    const scale = Math.min(scaleByHeight, scaleByWidth);

    this.door.scale.set(scale);
    this.door.position.set(viewportWidth / 2, viewportHeight / 2);

    this.layoutPressEnter(viewportWidth, viewportHeight, scale);
    this.startBlink();
  }

  public destroy(options?: DestroyOptions) {
    this.unbindInput();
    this.isDestroyed = true;
    this.stopBlink();
    this.door.onComplete = undefined;
    this.door.onFrameChange = undefined;
    super.destroy(options);
  }

  private createBackground() {
    const background = new Sprite(Texture.WHITE);
    background.tint = TITLE_BACKGROUND_COLOR;
    background.anchor.set(0, 0);

    return background;
  }

  private createDoor() {
    const door = new AnimatedSprite({
      textures: this.doorFrames,
      autoPlay: false,
      loop: false,
      animationSpeed: DOOR_FRAME_COUNT / (DOOR_ANIMATION_SECONDS * 60),
    });

    door.anchor.set(0.5, 0.5);
    door.onComplete = () => {
      this.state = "opened";
      this.onDoorOpenComplete?.();
    };

    return door;
  }

  private createDoorFrames() {
    const sheet = Assets.get<Texture>("doorSheet");

    if (!sheet) {
      throw new Error("doorSheet asset is not loaded");
    }

    const frameWidth = sheet.width / DOOR_FRAME_COUNT;
    const frameHeight = sheet.height;

    if (!Number.isFinite(frameWidth) || frameWidth <= 0) {
      throw new Error("Invalid door sheet dimensions");
    }

    return Array.from({ length: DOOR_FRAME_COUNT }, (_, index) => {
      const frame = new Rectangle(frameWidth * index, 0, frameWidth, frameHeight);

      return new Texture({
        source: sheet.source,
        frame,
        orig: new Rectangle(0, 0, frameWidth, frameHeight),
        dynamic: false,
      });
    });
  }

  private createPressEnter() {
    const style = new TextStyle({
      fontFamily: [TITLE_FONT_FAMILY, PRESS_ENTER_FALLBACK_FONT],
      fontSize: 24,
      fill: PRESS_ENTER_COLOR,
      align: "center",
      dropShadow: false,
      stroke: "#000000",
    });

    const text = new Text({
      text: PRESS_ENTER_TEXT,
      style,
    });

    text.anchor.set(0.5, 0.5);
    text.resolution = 2;

    return text;
  }

  private layoutPressEnter(
    viewportWidth: number,
    viewportHeight: number,
    doorScale: number,
  ) {
    const doorFrame = this.doorFrames[0];
    const doorDisplayHeight = doorFrame.height * doorScale;
    const fontSize = Math.max(
      12,
      Math.min(36, Math.round(doorDisplayHeight * 0.055)),
    );

    this.pressEnter.style = new TextStyle({
      fontFamily: [TITLE_FONT_FAMILY, PRESS_ENTER_FALLBACK_FONT],
      fontSize,
      fill: PRESS_ENTER_COLOR,
      align: "center",
      stroke: "#000000",
    });

    const bottomMargin = viewportHeight * PRESS_ENTER_BOTTOM_MARGIN_RATIO;
    const gap = Math.max(12, doorDisplayHeight * PRESS_ENTER_GAP_RATIO);

    this.pressEnter.position.set(
      viewportWidth / 2,
      Math.min(
        viewportHeight - bottomMargin,
        viewportHeight / 2 + doorDisplayHeight / 2 + gap,
      ),
    );
  }

  private handleInput = () => {
    this.openDoor();
  };

  private startBlink() {
    this.stopBlink();

    this.pressEnter.visible = true;
    this.blinkTimer = window.setInterval(() => {
      if (this.state !== "waiting" || this.isDestroyed) {
        return;
      }

      this.pressEnter.visible = !this.pressEnter.visible;
    }, PRESS_ENTER_BLINK_INTERVAL_MS);
  }

  private stopBlink() {
    if (this.blinkTimer !== null) {
      window.clearInterval(this.blinkTimer);
      this.blinkTimer = null;
    }

    this.pressEnter.visible = false;
  }
}
