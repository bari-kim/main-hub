export const WORKSHOP_CONFIG = {
  world: {
    width: 2400,
  },
  floor: {
    height: 120,
    tileScale: 4,
  },
  player: {
    startX: 360,
    fallbackViewportHeightRatio: 0.4,
  },
  objects: {
    door: {
      playerHeightRatio: 1.5,
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
