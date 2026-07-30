import { Application, Container, Graphics, Point } from "pixi.js";
import {
  loadPlayerAssets,
  loadTitleAssets,
  loadWorkshopAssets,
} from "./assets/loadAssets";
import { Camera } from "./camera/Camera";
import { WORKSHOP_CONFIG } from "./constants/workshop";
import type { PatchNote, PatchNotesResponse } from "./content/patchNotes";
import { InputManager } from "./input/InputManager";
import { Player } from "./entities/player/Player";
import { InteractionSystem } from "./interaction/InteractionSystem";
import { WorkshopScene } from "./scenes/WorkshopScene";
import { TitleScene } from "./scenes/TitleScene";

type RoomEntranceState =
  | "title"
  | "opening-door"
  | "fading-to-white"
  | "walking-inside"
  | "preparing-room"
  | "fading-into-room"
  | "ready";

const DOOR_OPEN_SOUND_SRC = "/game-assets/sound/door-opening.wav";
const FOOTSTEPS_START_SOUND_SRC = "/game-assets/sound/footsteps-start.wav";
const DOOR_CLOSE_SOUND_SRC = "/game-assets/sound/door-close.wav";
const WHITE_FADE_DURATION_MS = 500;
const ROOM_PREP_DELAY_MS = 3000;
const ROOM_FADE_DURATION_MS = 700;
const ROOM_INTERACTION_UNLOCK_DELAY_MS = 3000;
const TITLE_BACKGROUND_COLOR = "#15131a";

type GameOptions = {
  patchNotes?: PatchNotesResponse;
  onNoticeInteract?: (patchNotes: PatchNote[]) => void;
};

export class Game {
  private readonly app = new Application();
  private readonly worldContainer = new Container();
  private readonly whiteOverlay = new Graphics();

  private input: InputManager | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private player: Player | null = null;
  private camera: Camera | null = null;
  private titleScene: TitleScene | null = null;
  private roomScene: WorkshopScene | null = null;

  private initialized = false;
  private destroyed = false;
  private sceneState: RoomEntranceState = "title";
  private activeTimers = new Set<number>();
  private readonly patchNotes: PatchNotesResponse;
  private readonly onNoticeInteract?: (patchNotes: PatchNote[]) => void;

  constructor(options?: GameOptions) {
    this.patchNotes = options?.patchNotes ?? { monthPatchCount: 0, patchNotes: [] };
    this.onNoticeInteract = options?.onNoticeInteract;
  }

  public async start(container: HTMLDivElement) {
    await this.app.init({
      background: TITLE_BACKGROUND_COLOR,
      resizeTo: container,
      antialias: false,
    });

    if (this.destroyed) {
      this.destroyPixiApplication();
      return;
    }

    this.initialized = true;
    container.appendChild(this.app.canvas);

    this.input = new InputManager();
    this.interactionSystem = new InteractionSystem();
    this.camera = this.createCamera();
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.whiteOverlay);
    this.whiteOverlay.visible = false;

    await Promise.all([
      loadTitleAssets(),
      loadWorkshopAssets(),
      loadPlayerAssets(),
      this.loadTitleFont(),
    ]);

    if (this.destroyed) {
      return;
    }

    this.createTitleScene();
    this.startGameLoop();
    window.addEventListener("resize", this.handleResize);
  }

  private createTitleScene() {
    this.titleScene = new TitleScene(
      this.handleTitleDoorOpenStart,
      this.handleTitleDoorOpenComplete,
    );
    this.titleScene.resize(this.app.screen.width, this.app.screen.height);
    this.titleScene.bindInput();
    this.worldContainer.addChild(this.titleScene);
  }

  private async loadTitleFont() {
    if (typeof document === "undefined" || !("fonts" in document)) {
      return;
    }

    try {
      const font = new FontFace(
        "DungGeunMo",
        'url("/game-assets/font/DungGeunMo.woff2")',
      );
      const loadedFont = await font.load();

      if (this.destroyed) {
        return;
      }

      document.fonts.add(loadedFont);
      await document.fonts.load('24px "DungGeunMo"');
    } catch {
      // Fallback font is handled by TitleScene.
    }
  }

  private getPlayerDisplayHeight() {
    return (
      this.player?.getDisplayHeight() ??
      this.app.screen.height *
        WORKSHOP_CONFIG.player.fallbackViewportHeightRatio
    );
  }

  private async createRoomScene() {
    this.roomScene = new WorkshopScene({
      noticeTextureAlias: this.getNoticeTextureAlias(this.patchNotes.monthPatchCount),
      onNoticeInteract: this.handleNoticeInteract,
    });
    this.roomScene.resize(this.app.screen.width, this.app.screen.height);
    this.roomScene.visible = false;
    this.roomScene.setInteractionLocked(true);
    this.worldContainer.addChildAt(this.roomScene, 0);

    this.player = await Player.create();

    if (this.destroyed || !this.roomScene || !this.player) {
      this.player?.destroy();
      this.player = null;
      return;
    }

    this.player.resizeForViewport(this.app.screen.height);
    this.player.x = WORKSHOP_CONFIG.player.startX;
    this.player.y = this.getGroundY();
    this.player.setInputEnabled(false);

    this.worldContainer.addChild(this.player);
    this.camera?.follow(this.getPlayerCameraTarget());
    this.camera?.applyTo(this.worldContainer);
  }

  private activateRoomScene() {
    if (!this.roomScene) {
      return;
    }

    this.roomScene.visible = true;
    this.titleScene?.destroy();
    this.titleScene = null;
  }

  private startGameLoop() {
    this.app.ticker.add(this.update);
  }

  private update = () => {
    if (this.destroyed) {
      return;
    }

    if (this.sceneState !== "ready" || !this.player || !this.input || !this.roomScene) {
      return;
    }

    const didMove = this.player.update(
      this.app.ticker.deltaTime,
      this.input,
      this.getWorldSize().width,
      this.getGroundY(),
    );

    if (didMove) {
      this.camera?.follow(this.getPlayerCameraTarget());
    }

    this.camera?.update();
    this.camera?.applyTo(this.worldContainer);

    const pointerWorldPosition = this.getPointerWorldPosition();

    const interactionResult = this.interactionSystem?.update({
      playerPosition: this.getPlayerInteractionPosition(),
      pointerPosition: pointerWorldPosition,
      input: this.input,
      interactables: this.roomScene.getInteractables(),
    });

    this.roomScene.updateDoorState({
      hoveredDoor: this.roomScene.isDoorHovered(pointerWorldPosition),
      interactedDoor: interactionResult?.interactedIds.includes("door") ?? false,
      now: performance.now(),
    });

    this.input.update();
  };

  private handleResize = () => {
    requestAnimationFrame(() => {
      if (this.titleScene) {
        this.titleScene.resize(this.app.screen.width, this.app.screen.height);
      }

      if (this.roomScene) {
        this.roomScene.resize(this.app.screen.width, this.app.screen.height);
      }

      if (this.player) {
        this.player.resizeForViewport(this.app.screen.height);
        this.player.setGroundY(this.getGroundY());
        this.player.keepVisualInsideWorld(this.getWorldSize().width);
        this.camera?.resize(this.getViewportSize(), this.getWorldSize());
        this.camera?.follow(this.getPlayerCameraTarget());
        this.camera?.applyTo(this.worldContainer);
      }

      this.layoutWhiteOverlay();
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

  private getPointerWorldPosition() {
    const pointer = this.input?.getMousePosition() ?? { x: 0, y: 0 };
    const canvasRect = this.app.canvas.getBoundingClientRect();
    const globalPoint = new Point(
      pointer.x - canvasRect.left,
      pointer.y - canvasRect.top,
    );

    return this.worldContainer.toLocal(globalPoint, this.app.stage);
  }

  private createCamera() {
    return new Camera(this.getViewportSize(), this.getWorldSize());
  }

  private getNoticeTextureAlias(monthPatchCount: number) {
    if (monthPatchCount <= 2) {
      return "noticeEmpty";
    }

    if (monthPatchCount <= 5) {
      return "notice01";
    }

    return "notice02";
  }

  private handleNoticeInteract = () => {
    this.onNoticeInteract?.(this.patchNotes.patchNotes);
  };

  private destroyPixiApplication() {
    if (this.app.ticker) {
      this.app.ticker.remove(this.update);
    }

    const appWithResizeHook = this.app as Application & {
      _cancelResize?: unknown;
    };

    if (typeof appWithResizeHook._cancelResize !== "function") {
      return;
    }

    this.app.destroy();
  }

  private getViewportSize() {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height,
    };
  }

  private getWorldSize() {
    return {
      width: this.roomScene?.getWorldWidth() ?? WORKSHOP_CONFIG.world.width,
      height:
        this.roomScene?.getWorldHeight(this.app.screen.height) ??
        this.app.screen.height,
    };
  }

  private getGroundY() {
    return (
      this.roomScene?.getFloorY(this.app.screen.height) ??
      this.app.screen.height -
        this.app.screen.height * WORKSHOP_CONFIG.floor.displayHeightRatio
    );
  }

  private showWhiteOverlay(alpha: number) {
    this.whiteOverlay.visible = true;
    this.whiteOverlay.alpha = alpha;
    this.layoutWhiteOverlay();
  }

  private hideWhiteOverlay() {
    this.whiteOverlay.visible = false;
  }

  private layoutWhiteOverlay() {
    this.whiteOverlay.clear();
    this.whiteOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.whiteOverlay.fill(0xffffff);
  }

  private animateWhiteOverlay(from: number, to: number, durationMs: number) {
    this.showWhiteOverlay(from);
    const startedAt = performance.now();

    return new Promise<void>((resolve) => {
      const tick = () => {
        if (this.destroyed) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startedAt;
        const progress = Math.min(1, elapsed / durationMs);
        this.whiteOverlay.alpha = from + (to - from) * progress;

        if (progress >= 1) {
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        this.activeTimers.delete(timer);
        resolve();
      }, ms);

      this.activeTimers.add(timer);
    });
  }

  private playTimedSfx(src: string, volume = 1, maxDurationMs?: number) {
    return new Promise<void>((resolve) => {
      try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.preload = "auto";

        const finish = () => {
          audio.removeEventListener("ended", finish);
          if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
            this.activeTimers.delete(timeoutId);
            timeoutId = null;
          }
          resolve();
        };

        audio.addEventListener("ended", finish, { once: true });
        let timeoutId: number | null = null;

        if (maxDurationMs !== undefined) {
          timeoutId = window.setTimeout(() => {
            audio.pause();
            finish();
          }, maxDurationMs);
          this.activeTimers.add(timeoutId);
        }

        void audio.play().catch(() => {
          if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
            this.activeTimers.delete(timeoutId);
            timeoutId = null;
          }
          audio.removeEventListener("ended", finish);
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  private playSfx(src: string, volume = 1) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.preload = "auto";
      void audio.play().catch(() => {});
    } catch {
      // Ignore audio construction failures.
    }
  }

  public destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.sceneState = "title";

    for (const timer of this.activeTimers) {
      window.clearTimeout(timer);
    }
    this.activeTimers.clear();

    window.removeEventListener("resize", this.handleResize);

    this.titleScene?.destroy();
    this.titleScene = null;
    this.roomScene?.destroy();
    this.roomScene = null;
    this.input?.destroy();
    this.input = null;
    this.interactionSystem = null;

    this.destroyPixiApplication();
  }

  private handleTitleDoorOpenStart = () => {
    if (this.sceneState !== "title") {
      return;
    }

    this.sceneState = "opening-door";
    this.playSfx(DOOR_OPEN_SOUND_SRC);
  };

  private handleTitleDoorOpenComplete = async () => {
    if (this.sceneState !== "opening-door") {
      return;
    }

    this.sceneState = "fading-to-white";
    this.showWhiteOverlay(0);
    await this.animateWhiteOverlay(0, 1, WHITE_FADE_DURATION_MS);

    if (this.destroyed) {
      return;
    }

    this.sceneState = "walking-inside";
    await Promise.all([
      this.wait(ROOM_PREP_DELAY_MS),
      this.playTimedSfx(FOOTSTEPS_START_SOUND_SRC, 1, ROOM_PREP_DELAY_MS),
    ]);

    if (this.destroyed) {
      return;
    }

    this.sceneState = "preparing-room";
    await this.createRoomScene();

    if (this.destroyed) {
      return;
    }

    this.activateRoomScene();

    if (this.destroyed) {
      return;
    }

    this.sceneState = "fading-into-room";
    await this.playTimedSfx(DOOR_CLOSE_SOUND_SRC, 0.4);

    if (this.destroyed) {
      return;
    }

    await this.animateWhiteOverlay(1, 0, ROOM_FADE_DURATION_MS);

    if (this.destroyed) {
      return;
    }

    this.hideWhiteOverlay();
    this.player?.setInputEnabled(true);
    this.sceneState = "ready";

    if (this.roomScene) {
      this.wait(ROOM_INTERACTION_UNLOCK_DELAY_MS).then(() => {
        if (!this.destroyed && this.sceneState === "ready") {
          this.roomScene?.setInteractionLocked(false);
        }
      });
    }
  };
}
