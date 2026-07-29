import type { AssetsManifest } from "pixi.js";

export const assetsManifest: AssetsManifest = {
  bundles: [
    {
      name: "workshop",
      assets: [
        {
          alias: "floor",
          src: "/game-assets/tiles/floor.png",
        },
        {
          alias: "wall",
          src: "/game-assets/tiles/wall.png",
        },
        {
          alias: "door",
          src: "/game-assets/objects/door.png",
        },
        {
          alias: "doorOpen",
          src: "/game-assets/objects/door_open.png",
        },
        {
          alias: "notice",
          src: "/game-assets/objects/notice_temp.png",
        },
        {
          alias: "desk",
          src: "/game-assets/objects/desk_temp.png",
        },
      ],
    },
    {
      name: "player",
      assets: [
        {
          alias: "playerWalkRight",
          src: "/game-assets/characters/player/walk_right_temp.png",
        },
      ],
    },
  ],
};
