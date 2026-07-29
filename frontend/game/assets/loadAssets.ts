import { Assets, Texture } from "pixi.js";
import { assetsManifest } from "./manifest";

let initializePromise: Promise<void> | null = null;
let workshopLoadPromise: Promise<void> | null = null;
let playerLoadPromise: Promise<void> | null = null;

export async function initializeAssets() {
  initializePromise ??= Assets.init({ manifest: assetsManifest });

  await initializePromise;
}

export async function loadWorkshopAssets() {
  await initializeAssets();

  workshopLoadPromise ??= Assets.loadBundle("workshop").then(() => {
    applyNearestScaleMode(["floor", "wall", "door", "doorOpen", "notice", "desk"]);
  });

  await workshopLoadPromise;
}

export async function loadPlayerAssets() {
  await initializeAssets();

  playerLoadPromise ??= Assets.loadBundle("player").then(() => {
    applyNearestScaleMode(["playerWalkRight"]);
  });

  await playerLoadPromise;
}

function applyNearestScaleMode(aliases: string[]) {
  for (const alias of aliases) {
    const texture = Assets.get<Texture>(alias);

    if (texture?.source) {
      texture.source.scaleMode = "nearest";
    }
  }
}
