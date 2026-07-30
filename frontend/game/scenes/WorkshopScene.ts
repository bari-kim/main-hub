import { Assets, Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { WORKSHOP_CONFIG } from "../constants/workshop";
import type { Interactable } from "../interaction/Interactable";

type WorkshopObjectKey = "door" | "desk" | "notice";
type Point = { x: number; y: number };
type DoorVisualState = "closed" | "open";
type NoticeTextureAlias = "noticeEmpty" | "notice01" | "notice02";
type ObjectMovementBounds = {
  minXRatio: number;
  maxXRatio: number;
};

const FLOOR_SEAM_OVERLAP = 1;
const DOOR_INTERACTION_OPEN_DURATION_MS = 3000;
const DOOR_HOVER_CLOSE_DELAY_MS = 1500;
const NOTICE_SCALE_MULTIPLIER = 1.6;
const DOOR_OPEN_SOUND_SRC = "/game-assets/sound/door-opening.wav";
const DOOR_CLOSE_SOUND_SRC = "/game-assets/sound/door-close.wav";

export class WorkshopScene extends Container {
  private readonly objects = new Map<WorkshopObjectKey, Sprite>();
  private readonly doorBaseFrameSize = this.getTextureSize("door");
  private readonly noticeTextureAlias: NoticeTextureAlias;
  private readonly onNoticeInteract?: () => void;
  private readonly doorTextures = {
    closed: Assets.get<Texture>("door"),
    open: Assets.get<Texture>("doorOpen"),
  };

  private doorOpenUntil = 0;
  private doorCloseAt = 0;
  private previousHoveredDoor = false;
  private doorVisualState: DoorVisualState = "closed";
  private interactionLocked = true;
  private doorSoundLockUntil = 0;

  private readonly wall: Sprite;
  private readonly floor: TilingSprite;

  constructor(args?: {
    noticeTextureAlias?: NoticeTextureAlias;
    onNoticeInteract?: () => void;
  }) {
    super();

    this.noticeTextureAlias = args?.noticeTextureAlias ?? "noticeEmpty";
    this.onNoticeInteract = args?.onNoticeInteract;

    this.wall = this.createWall();
    this.floor = this.createFloor();

    this.addChild(this.wall);
    this.addChild(this.floor);

    this.createObject("door", "door", 0.5, 1);
    this.createObject("notice", this.noticeTextureAlias, 0.5, 0.5);
    this.createObject("desk", "desk", 0.5, 1);
  }

  public resize(viewportWidth: number, viewportHeight: number) {
    this.drawBackground(viewportHeight);
    this.placeDoor(viewportWidth, viewportHeight);
    this.placeDesk(viewportWidth, viewportHeight);
    this.placeNotice(viewportWidth, viewportHeight);
  }

  public updateDoorState(args: {
    hoveredDoor: boolean;
    interactedDoor: boolean;
    now: number;
  }) {
    const door = this.objects.get("door");

    if (!door) {
      return;
    }

    if (this.interactionLocked) {
      this.forceDoorClosed(true);
      return;
    }

    const wasHovered = this.previousHoveredDoor;

    if (args.interactedDoor) {
      this.doorOpenUntil = Math.max(
        this.doorOpenUntil,
        args.now + DOOR_INTERACTION_OPEN_DURATION_MS,
      );
    }

    if (args.hoveredDoor) {
      this.openDoor(args.now);
    } else if (wasHovered && !args.hoveredDoor && this.doorCloseAt === 0) {
      this.doorCloseAt = args.now + DOOR_HOVER_CLOSE_DELAY_MS;
    }

    const shouldStayOpen =
      args.hoveredDoor ||
      args.interactedDoor ||
      args.now < this.doorOpenUntil ||
      args.now < this.doorCloseAt;

    if (shouldStayOpen) {
      this.openDoor(args.now);
    } else if (this.doorVisualState === "open") {
      this.closeDoor(args.now);
    }

    const nextTexture =
      this.doorVisualState === "open"
        ? this.doorTextures.open
        : this.doorTextures.closed;

    if (door.texture !== nextTexture) {
      door.texture = nextTexture;
    }

    this.previousHoveredDoor = args.hoveredDoor;
  }

  public isDoorHovered(pointerWorldPosition: Point) {
    const door = this.objects.get("door");

    if (!door) {
      return false;
    }

    const left = door.x - door.width / 2;
    const right = door.x + door.width / 2;
    const top = door.y - door.height;
    const bottom = door.y;

    return (
      pointerWorldPosition.x >= left &&
      pointerWorldPosition.x <= right &&
      pointerWorldPosition.y >= top &&
      pointerWorldPosition.y <= bottom
    );
  }

  public isNoticeHovered(pointerWorldPosition: Point) {
    const notice = this.objects.get("notice");

    if (!notice) {
      return false;
    }

    const left = notice.x - notice.width / 2;
    const right = notice.x + notice.width / 2;
    const top = notice.y - notice.height / 2;
    const bottom = notice.y + notice.height / 2;

    return (
      pointerWorldPosition.x >= left &&
      pointerWorldPosition.x <= right &&
      pointerWorldPosition.y >= top &&
      pointerWorldPosition.y <= bottom
    );
  }

  public getWorldWidth() {
    return WORKSHOP_CONFIG.world.width;
  }

  public getWorldHeight(viewportHeight: number) {
    return viewportHeight;
  }

  public getFloorY(viewportHeight: number) {
    return (
      viewportHeight -
      this.getFloorHeight(viewportHeight) -
      FLOOR_SEAM_OVERLAP
    );
  }

  public getInteractables(): Interactable[] {
    if (this.interactionLocked) {
      return [];
    }

    const interactables: Interactable[] = [];

    const door = this.objects.get("door");
    if (door) {
      interactables.push({
        id: "door",
        interactionPosition: this.getObjectInteractionPosition(door),
        interactionDistance: WORKSHOP_CONFIG.interaction.doorDistance,
        interactionKeys: ["w", "mouseleft"],
        interact: () => {
          this.openDoor(performance.now());
        },
      });
    }

    const notice = this.objects.get("notice");
    if (notice) {
      interactables.push({
        id: "notice",
        interactionPosition: this.getObjectInteractionPosition(notice),
        interactionDistance: WORKSHOP_CONFIG.interaction.noticeDistance,
        interactionKeys: ["e", "mouseleft"],
        mouseClickHitTest: (pointerPosition) => this.isNoticeHovered(pointerPosition),
        interact: () => {
          this.onNoticeInteract?.();
        },
      });
    }

    const desk = this.objects.get("desk");
    if (desk) {
      interactables.push({
        id: "desk",
        interactionPosition: this.getObjectInteractionPosition(desk),
        interactionDistance: WORKSHOP_CONFIG.interaction.deskDistance,
        interactionKeys: ["e", "mouseleft"],
        interact: () => {},
      });
    }

    return interactables;
  }

  public setInteractionLocked(locked: boolean) {
    this.interactionLocked = locked;

    if (locked) {
      this.forceDoorClosed(true);
    }
  }

  public destroy() {
    super.destroy();
  }

  private openDoor(now: number) {
    if (this.doorVisualState === "open") {
      return;
    }

    this.doorVisualState = "open";
    this.playDoorSound("open", now);
  }

  private forceDoorClosed(silent: boolean) {
    this.doorOpenUntil = 0;
    this.doorCloseAt = 0;
    this.previousHoveredDoor = false;
    this.doorVisualState = "closed";

    const door = this.objects.get("door");
    if (door && door.texture !== this.doorTextures.closed) {
      door.texture = this.doorTextures.closed;
    }

    if (!silent) {
      this.playDoorSound("close", performance.now());
    }
  }

  private closeDoor(now: number) {
    if (this.doorVisualState === "closed") {
      return;
    }

    this.doorOpenUntil = 0;
    this.doorCloseAt = 0;
    this.doorVisualState = "closed";
    this.playDoorSound("close", now);
  }

  private playDoorSound(state: "open" | "close", now: number) {
    if (now < this.doorSoundLockUntil) {
      return;
    }

    this.doorSoundLockUntil = now + 250;

    const src = state === "open" ? DOOR_OPEN_SOUND_SRC : DOOR_CLOSE_SOUND_SRC;

    try {
      const audio = new Audio(src);
      audio.preload = "auto";
      void audio.play().catch(() => {});
    } catch {
      // Ignore missing audio files or autoplay blocks.
    }
  }

  private createWall() {
    const wall = new Sprite(Assets.get<Texture>("wall"));

    wall.anchor.set(0, 0);

    return wall;
  }

  private createFloor() {
    const floor = new TilingSprite({
      texture: Assets.get<Texture>("floor"),
      width: WORKSHOP_CONFIG.world.width,
      height: 1,
    });

    floor.tileScale.set(WORKSHOP_CONFIG.floor.tileScale);

    return floor;
  }

  private createObject(
    key: WorkshopObjectKey,
    textureAlias: string,
    anchorX: number,
    anchorY: number,
  ) {
    const object = new Sprite(Assets.get<Texture>(textureAlias));

    object.anchor.set(anchorX, anchorY);
    this.objects.set(key, object);
    this.addChild(object);
  }

  private drawBackground(viewportHeight: number) {
    this.wall.width = WORKSHOP_CONFIG.world.width;
    this.wall.height = this.getWallHeight(viewportHeight) + FLOOR_SEAM_OVERLAP;
    this.wall.position.set(0, 0);

    this.floor.width = WORKSHOP_CONFIG.world.width;
    this.floor.height = this.getFloorHeight(viewportHeight);
    this.floor.tileScale.set(this.getFloorTileScale(viewportHeight));
    this.floor.y = this.getFloorY(viewportHeight);
  }

  private placeDoor(viewportWidth: number, viewportHeight: number) {
    const door = this.objects.get("door");

    if (!door) {
      return;
    }

    const displayHeight =
      viewportHeight * WORKSHOP_CONFIG.objects.door.displayHeightRatio;
    const scale = displayHeight / this.doorBaseFrameSize.height;
    const x = this.resolveObjectX(
      viewportWidth,
      door,
      WORKSHOP_CONFIG.objects.door.positionXRatio,
      WORKSHOP_CONFIG.objects.door.movementBounds,
    );
    const y = this.resolveObjectY(
      viewportHeight,
      WORKSHOP_CONFIG.objects.door.positionYRatio,
    );

    door.scale.set(scale);
    door.position.set(x, y);
  }

  private placeDesk(viewportWidth: number, viewportHeight: number) {
    const desk = this.objects.get("desk");

    if (!desk) {
      return;
    }

    const displayHeight =
      viewportHeight * WORKSHOP_CONFIG.objects.desk.displayHeightRatio;
    const scale = displayHeight / desk.texture.height;
    const x = this.resolveObjectX(
      viewportWidth,
      desk,
      WORKSHOP_CONFIG.objects.desk.positionXRatio,
      WORKSHOP_CONFIG.objects.desk.movementBounds,
    );
    const y = this.resolveObjectY(
      viewportHeight,
      WORKSHOP_CONFIG.objects.desk.positionYRatio,
    );

    desk.scale.set(scale);
    desk.position.set(x, y);
  }

  private placeNotice(viewportWidth: number, viewportHeight: number) {
    const notice = this.objects.get("notice");
    const door = this.objects.get("door");

    if (!notice) {
      return;
    }

    const displayHeight =
      viewportHeight * WORKSHOP_CONFIG.objects.notice.displayHeightRatio;
    const scale = displayHeight / notice.texture.height;
    const noticeHalfWidth = (notice.texture.width * scale * NOTICE_SCALE_MULTIPLIER) / 2;
    const x = this.resolveObjectX(
      viewportWidth,
      notice,
      WORKSHOP_CONFIG.objects.notice.positionXRatio,
      WORKSHOP_CONFIG.objects.notice.movementBounds,
      noticeHalfWidth,
      door ? door.x + door.width / 2 + noticeHalfWidth : undefined,
    );
    const noticeY = this.resolveObjectY(
      viewportHeight,
      WORKSHOP_CONFIG.objects.notice.positionYRatio,
    );

    notice.scale.set(scale * NOTICE_SCALE_MULTIPLIER);
    notice.position.set(x, noticeY);
  }

  private getWallHeight(viewportHeight: number) {
    return Math.max(
      0,
      viewportHeight - this.getFloorHeight(viewportHeight) - FLOOR_SEAM_OVERLAP,
    );
  }

  private getFloorHeight(viewportHeight: number) {
    return viewportHeight * WORKSHOP_CONFIG.floor.displayHeightRatio;
  }

  private getFloorTileScale(viewportHeight: number) {
    return (
      WORKSHOP_CONFIG.floor.tileScale *
      (viewportHeight / WORKSHOP_CONFIG.floor.tileScaleBaseHeight)
    );
  }

  private getObjectInteractionPosition(object: Sprite) {
    return {
      x: object.x,
      y: object.y,
    };
  }

  private resolveObjectX(
    viewportWidth: number,
    object: Sprite,
    positionXRatio: number,
    movementBounds?: ObjectMovementBounds,
    halfWidth?: number,
    minimumXOverride?: number,
  ) {
    const preferredX = viewportWidth * positionXRatio;
    const currentHalfWidth = halfWidth ?? object.width / 2;
    const minBound =
      minimumXOverride ??
      (movementBounds ? viewportWidth * movementBounds.minXRatio : 0);
    const maxBound = movementBounds
      ? viewportWidth * movementBounds.maxXRatio
      : viewportWidth - currentHalfWidth;

    return Math.max(
      minBound + currentHalfWidth,
      Math.min(preferredX, maxBound - currentHalfWidth),
    );
  }

  private resolveObjectY(viewportHeight: number, positionYRatio: number) {
    return this.getWallHeight(viewportHeight) * positionYRatio;
  }

  private getTextureSize(alias: "door" | "doorOpen") {
    const texture = Assets.get<Texture>(alias);

    return {
      width: texture.orig.width,
      height: texture.orig.height,
    };
  }
}
