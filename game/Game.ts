import { Application, Container } from "pixi.js";
import { loadPlayerAssets, loadWorkshopAssets } from "./assets/loadAssets";
import { Camera } from "./camera/Camera";
import { WORKSHOP_CONFIG } from "./constants/workshop";
import { InputManager } from "./input/InputManager";
import { Player } from "./entities/player/Player";
import { InteractionSystem } from "./interaction/InteractionSystem";
import { WorkshopScene } from "./scenes/WorkshopScene";

export class Game {
  private readonly app = new Application();
  private readonly worldContainer = new Container();

  private input: InputManager | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private player: Player | null = null;
  private camera: Camera | null = null;
  private currentScene: WorkshopScene | null = null;

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
    this.interactionSystem = new InteractionSystem();
    this.camera = this.createCamera();
    this.app.stage.addChild(this.worldContainer);

    await Promise.all([loadWorkshopAssets(), loadPlayerAssets()]);

    if (this.destroyed) {
      return;
    }

    this.createScene();
    await this.createPlayer();
    this.startGameLoop();

    window.addEventListener("resize", this.handleResize);
  }

  private createScene() {
    this.currentScene = new WorkshopScene();
    this.currentScene.resize(
      this.app.screen.height,
      this.getPlayerDisplayHeight(),
    );
    this.worldContainer.addChild(this.currentScene);
  }

  private getPlayerDisplayHeight() {
    return (
      this.player?.getDisplayHeight() ??
      this.app.screen.height *
        WORKSHOP_CONFIG.player.fallbackViewportHeightRatio
    );
  }

  private async createPlayer() {
    this.player = await Player.create();

    if (this.destroyed) {
      this.player.destroy();
      this.player = null;
      return;
    }

    this.player.resizeForViewport(this.app.screen.height);

    this.player.x = WORKSHOP_CONFIG.player.startX;
    this.placePlayerOnFloor();

    this.worldContainer.addChild(this.player);
    this.camera?.follow(this.getPlayerCameraTarget());
    this.camera?.applyTo(this.worldContainer);
  }

  private placePlayerOnFloor() {
    if (!this.player) {
      return;
    }

    this.player.y =
      this.currentScene?.getFloorY(this.app.screen.height) ??
      this.app.screen.height - WORKSHOP_CONFIG.floor.height;
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
      this.getWorldSize().width,
    );

    if (didMove) {
      this.camera?.follow(this.getPlayerCameraTarget());
    }

    this.camera?.update();
    this.camera?.applyTo(this.worldContainer);

    this.interactionSystem?.update({
      playerPosition: this.getPlayerInteractionPosition(),
      input: this.input,
      interactables: this.currentScene?.getInteractables() ?? [],
    });

    this.input.update();
  };

  private handleResize = () => {
    requestAnimationFrame(() => {
      if (this.player) {
        this.player.resizeForViewport(this.app.screen.height);
        this.placePlayerOnFloor();
        this.player.keepVisualInsideWorld(this.getWorldSize().width);
        this.camera?.resize(this.getViewportSize(), this.getWorldSize());
        this.camera?.follow(this.getPlayerCameraTarget());
        this.camera?.applyTo(this.worldContainer);
      }

      this.currentScene?.resize(
        this.app.screen.height,
        this.getPlayerDisplayHeight(),
      );
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

  private getPlayerInteractionPosition() {
    return this.player?.getInteractionOrigin() ?? { x: 0, y: 0 };
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
      width: this.currentScene?.getWorldWidth() ?? WORKSHOP_CONFIG.world.width,
      height:
        this.currentScene?.getWorldHeight(this.app.screen.height) ??
        this.app.screen.height,
    };
  }

  public destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    window.removeEventListener("resize", this.handleResize);

    this.input?.destroy();
    this.input = null;
    this.interactionSystem = null;

    if (!this.initialized) {
      return;
    }

    this.app.ticker.remove(this.update);
    this.app.destroy(true);
  }
}
