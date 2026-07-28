"use client";

import { useEffect, useRef } from "react";
import { Game } from "../game/Game";

export default function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Game();

    void game.start(container);

    return () => {
      game.destroy();
    };
  }, []);

  return <div ref={containerRef} className="h-screen w-screen" />;
}