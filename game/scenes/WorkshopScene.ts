import {
  Assets,
  Container,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import { WORKSHOP_CONFIG } from "../constants/workshop";
import type { Interactable } from "../interaction/Interactable";

type WorkshopObjectKey = "door" | "desk" | "notice";

export class WorkshopScene extends Container {
  private readonly objects = new Map<WorkshopObjectKey, Sprite>();

  private readonly wall: TilingSprite;
  private readonly floor: TilingSprite;

  constructor() {
    super();

    this.wall = this.createWall();
    this.floor = this.createFloor();

    this.addChild(this.wall);
    this.addChild(this.floor);

    this.createObject("door", "door", 0.5, 1);
    this.createObject("notice", "notice", 0.5, 0.5);
    this.createObject("desk", "desk", 0.5, 1);
  }

  public resize(viewportHeight: number, playerDisplayHeight: number) {
    this.drawBackground(viewportHeight);
    this.placeDoor(viewportHeight, playerDisplayHeight);
    this.placeNotice(viewportHeight);
    this.placeDesk(viewportHeight);
  }

  public getWorldWidth() {
    return WORKSHOP_CONFIG.world.width;
  }

  public getWorldHeight(viewportHeight: number) {
    return viewportHeight;
  }

  public getFloorY(viewportHeight: number) {
    return viewportHeight - WORKSHOP_CONFIG.floor.height;
  }

  public getInteractables(): Interactable[] {
    const interactables: Interactable[] = [];

    const door = this.objects.get("door");
    if (door) {
      interactables.push({
        id: "door",
        interactionPosition: this.getObjectInteractionPosition(door),
        interactionDistance: WORKSHOP_CONFIG.interaction.doorDistance,
        interactionKeys: ["w", "e"],
        interact: () => {
          console.log("문과 상호작용");
        },
      });
    }

    const notice = this.objects.get("notice");
    if (notice) {
      interactables.push({
        id: "notice",
        interactionPosition: this.getObjectInteractionPosition(notice),
        interactionDistance: WORKSHOP_CONFIG.interaction.noticeDistance,
        interactionKeys: ["e"],
        interact: () => {
          console.log("게시판과 상호작용");
        },
      });
    }

    const desk = this.objects.get("desk");
    if (desk) {
      interactables.push({
        id: "desk",
        interactionPosition: this.getObjectInteractionPosition(desk),
        interactionDistance: WORKSHOP_CONFIG.interaction.deskDistance,
        interactionKeys: ["e"],
        interact: () => {
          console.log("책상과 상호작용");
        },
      });
    }

    return interactables;
  }

  private createWall() {
    return new TilingSprite({
      texture: Assets.get<Texture>("wall"),
      width: WORKSHOP_CONFIG.world.width,
      height: 0,
    });
  }

  private createFloor() {
    const floor = new TilingSprite({
      texture: Assets.get<Texture>("floor"),
      width: WORKSHOP_CONFIG.world.width,
      height: WORKSHOP_CONFIG.floor.height,
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
    this.wall.height = this.getWallHeight(viewportHeight);
    this.wall.position.set(0, 0);

    this.floor.width = WORKSHOP_CONFIG.world.width;
    this.floor.height = WORKSHOP_CONFIG.floor.height;
    this.floor.y = this.getFloorY(viewportHeight);
  }

  private placeDoor(viewportHeight: number, playerDisplayHeight: number) {
    const door = this.objects.get("door");

    if (!door) {
      return;
    }

    const displayHeight =
      playerDisplayHeight * WORKSHOP_CONFIG.objects.door.playerHeightRatio;
    const scale = displayHeight / door.texture.height;

    door.scale.set(scale);
    door.position.set(
      WORKSHOP_CONFIG.player.startX,
      this.getFloorY(viewportHeight),
    );
  }

  private placeDesk(viewportHeight: number) {
    const desk = this.objects.get("desk");

    if (!desk) {
      return;
    }

    const displayHeight =
      viewportHeight * WORKSHOP_CONFIG.objects.desk.displayHeightRatio;
    const scale = displayHeight / desk.texture.height;

    desk.scale.set(scale);
    desk.position.set(
      WORKSHOP_CONFIG.objects.desk.x,
      this.getFloorY(viewportHeight),
    );
  }

  private placeNotice(viewportHeight: number) {
    const notice = this.objects.get("notice");

    if (!notice) {
      return;
    }

    const displayHeight =
      viewportHeight * WORKSHOP_CONFIG.objects.notice.displayHeightRatio;
    const scale = displayHeight / notice.texture.height;
    const noticeX =
      (WORKSHOP_CONFIG.player.startX + WORKSHOP_CONFIG.objects.desk.x) / 2;
    const noticeY = this.getWallHeight(viewportHeight) / 2;

    notice.scale.set(scale);
    notice.position.set(noticeX, noticeY);
  }

  private getWallHeight(viewportHeight: number) {
    return Math.max(0, viewportHeight - WORKSHOP_CONFIG.floor.height);
  }

  private getObjectInteractionPosition(object: Sprite) {
    return {
      x: object.x,
      y: object.y,
    };
  }
}
