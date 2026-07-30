export const WORKSHOP_CONFIG = {
  world: {
    width: 2400,
  },
  floor: {
    displayHeightRatio: 0.12,
    tileScale: 4,
    tileScaleBaseHeight: 1080,
  },
  player: {
    startX: 360,
    fallbackViewportHeightRatio: 0.4,
  },
  objects: {
    door: {
      displayHeightRatio: 0.65,
    },
    desk: {
      x: 1700,
      displayHeightRatio: 0.2,
    },
    notice: {
      displayHeightRatio: 0.18,
    },
  },
  interaction: {
    doorDistance: 260,
    noticeDistance: 220,
    deskDistance: 260,
  },
} as const;
