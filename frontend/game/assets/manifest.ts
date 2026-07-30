import type { AssetsManifest } from "pixi.js";

export const assetsManifest: AssetsManifest = {
  bundles: [
    {
      name: "title",
      assets: [
        {
          alias: "doorSheet",
          src: "/game-assets/start/door01-sheet.png",
        },
        {
          alias: "titleFontWoff2",
          src: "/game-assets/font/DungGeunMo.woff2",
        },
      ],
    },
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
          src: "/game-assets/objects/notice_empty.png",
        },
        {
          alias: "noticeEmpty",
          src: "/game-assets/objects/notice_empty.png",
        },
        {
          alias: "notice01",
          src: "/game-assets/objects/notice01.png",
        },
        {
          alias: "notice02",
          src: "/game-assets/objects/notice02.png",
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
