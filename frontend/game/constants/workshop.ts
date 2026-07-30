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
      positionXRatio: 0.15,
      positionYRatio: 1,
      displayHeightRatio: 0.65,
      movementBounds: {
        minXRatio: 0.08,
        maxXRatio: 0.28,
      },
    },
    desk: {
      positionXRatio: 0.71,
      positionYRatio: 1,
      displayHeightRatio: 0.2,
      movementBounds: {
        minXRatio: 0.6,
        maxXRatio: 0.82,
      },
    },
    notice: {
      displayHeightRatio: 0.18,
      positionXRatio: 0.54,
      positionYRatio: 0.56,
      movementBounds: {
        minXRatio: 0.42,
        maxXRatio: 0.62,
      },
    },
  },
  interaction: {
    doorDistance: 260,
    noticeDistance: 1000,
    deskDistance: 260,
  },
} as const;
