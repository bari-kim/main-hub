import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import doorImage from "../assets/objects/door_temp.png";
import floorTileImage from "../assets/tiles/floor_temp.png";
import wallTileImage from "../assets/tiles/wall_temp.png";
import { Camera } from "./camera/Camera";
import { InputManager } from "./input/InputManager";
import { Player } from "./entities/player/Player";

const FLOOR_HEIGHT = 120;
const FLOOR_TILE_SCALE = 0.35;
const DOOR_PLAYER_HEIGHT_RATIO = 1.5;
const PLAYER_START_X = 360;
const WORLD_WIDTH = 2400;

type ImportedImage = string | { src: string };

export class Game {
  private readonly app = new Application();
  private readonly worldContainer = new Container();

  private input: InputManager | null = null;
  private player: Player | null = null;
  private wall: TilingSprite | null = null;
  private floor: TilingSprite | null = null;
  private door: Sprite | null = null;
  private camera: Camera | null = null;

  private initialized = false;
  private destroyed = false;

  public async start(container: HTMLDivElement) {
    await this.app.init({
      background: "#15131a",
      resizeTo: container,
      antialias: false,
    });

    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }

    this.initialized = true;

    container.appendChild(this.app.canvas);

    this.input = new InputManager();
    this.camera = this.createCamera();
    this.app.stage.addChild(this.worldContainer);

    await this.createBackground();
    await this.createDoor();
    await this.createPlayer();
    this.startGameLoop();

    window.addEventListener("resize", this.handleResize);
  }

  private async createBackground() {
    const [wallTexture, floorTexture] = await Promise.all([
      this.loadTexture(wallTileImage),
      this.loadTexture(floorTileImage),
    ]);

    if (this.destroyed) {
      return;
    }

    this.wall = new TilingSprite({
      texture: wallTexture,
      width: WORLD_WIDTH,
      height: this.getWallHeight(),
    });

    this.floor = new TilingSprite({
      texture: floorTexture,
      width: WORLD_WIDTH,
      height: FLOOR_HEIGHT,
    });
    this.floor.tileScale.set(FLOOR_TILE_SCALE);

    this.drawBackground();

    this.worldContainer.addChild(this.wall);
    this.worldContainer.addChild(this.floor);
  }

  private async createDoor() {
    const doorTexture = await this.loadTexture(doorImage);

    if (this.destroyed) {
      return;
    }

    this.door = new Sprite(doorTexture);
    this.door.anchor.set(0.5, 1);

    this.placeDoor();

    this.worldContainer.addChild(this.door);
  }

  private drawBackground() {
    if (!this.wall || !this.floor) {
      return;
    }

    this.wall.width = WORLD_WIDTH;
    this.wall.height = this.getWallHeight();
    this.wall.position.set(0, 0);

    this.floor.width = WORLD_WIDTH;
    this.floor.height = FLOOR_HEIGHT;
    this.floor.y = this.app.screen.height - FLOOR_HEIGHT;
  }

  private placeDoor() {
    if (!this.door) {
      return;
    }

    const displayHeight =
      this.getPlayerDisplayHeight() * DOOR_PLAYER_HEIGHT_RATIO;
    const scale = displayHeight / this.door.texture.height;

    this.door.scale.set(scale);
    this.door.position.set(PLAYER_START_X, this.app.screen.height - FLOOR_HEIGHT);
  }

  private getPlayerDisplayHeight() {
    return this.player?.getDisplayHeight() ?? this.app.screen.height * 0.4;
  }

  private async createPlayer() {
    this.player = await Player.create();

    if (this.destroyed) {
      this.player.destroy();
      this.player = null;
      return;
    }

    this.player.resizeForViewport(this.app.screen.height);

    this.player.x = PLAYER_START_X;
    this.placePlayerOnFloor();

    this.worldContainer.addChild(this.player);
    this.camera?.follow(this.getPlayerCameraTarget());
    this.camera?.applyTo(this.worldContainer);
  }

  private placePlayerOnFloor() {
    if (!this.player) {
      return;
    }

    this.player.y = this.app.screen.height - FLOOR_HEIGHT;
  }

  private startGameLoop() {
    this.app.ticker.add(this.update);
  }

  private update = () => {
    if (!this.player || !this.input) {
      return;
    }

    const didMove = this.player.update(
      this.app.ticker.deltaTime,
      this.input,
      WORLD_WIDTH,
    );

    if (didMove) {
      this.camera?.follow(this.getPlayerCameraTarget());
    }

    this.camera?.update();
    this.camera?.applyTo(this.worldContainer);

    this.handleInteractions();

    this.input.update();
  };

  private handleInteractions() {
    if (!this.input) {
      return;
    }

    if (this.input.wasPressed("w")) {
      console.log("W 상호작용");
    }

    if (this.input.wasPressed("e")) {
      console.log("E 상호작용");
    }
  }

  private handleResize = () => {
    requestAnimationFrame(() => {
      this.drawBackground();

      if (this.player) {
        this.player.resizeForViewport(this.app.screen.height);
        this.placePlayerOnFloor();
        this.player.keepVisualInsideWorld(WORLD_WIDTH);
        this.camera?.resize(this.getViewportSize(), this.getWorldSize());
        this.camera?.follow(this.getPlayerCameraTarget());
        this.camera?.applyTo(this.worldContainer);
      }

      this.placeDoor();
    });
  };

  private getPlayerCameraTarget() {
    if (!this.player) {
      return { x: 0, y: 0 };
    }

    return {
      x: this.player.x,
      y: this.player.y - this.player.getDisplayHeight() * 0.45,
    };
  }

  private createCamera() {
    return new Camera(this.getViewportSize(), this.getWorldSize());
  }

  private getViewportSize() {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height,
    };
  }

  private getWorldSize() {
    return {
      width: WORLD_WIDTH,
      height: this.app.screen.height,
    };
  }

  private getWallHeight() {
    return Math.max(0, this.app.screen.height - FLOOR_HEIGHT);
  }

  private async loadTexture(image: ImportedImage) {
    const texture = await Assets.load<Texture>(this.getImageSource(image));

    if (texture.source) {
      texture.source.scaleMode = "nearest";
    }

    return texture;
  }

  private getImageSource(image: ImportedImage) {
    return typeof image === "string" ? image : image.src;
  }

  public destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    window.removeEventListener("resize", this.handleResize);

    this.input?.destroy();
    this.input = null;

    if (!this.initialized) {
      return;
    }

    this.app.ticker.remove(this.update);
    this.app.destroy(true);
  }
}
