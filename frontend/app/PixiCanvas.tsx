"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "../game/Game";
import type { PatchNote, PatchNotesResponse } from "../game/content/patchNotes";
import { loadPatchNotes } from "../game/content/patchNotes";

export default function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [patchNotes, setPatchNotes] = useState<PatchNotesResponse>({
    monthPatchCount: 0,
    patchNotes: [],
  });
  const [activePatchNotes, setActivePatchNotes] = useState<PatchNote[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadPatchNotes().then((data) => {
      if (!cancelled) {
        setPatchNotes(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Game({
      patchNotes,
      onNoticeInteract: setActivePatchNotes,
    });

    void game.start(container);

    return () => {
      game.destroy();
    };
  }, [patchNotes]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={containerRef} className="h-screen w-screen" />
      {activePatchNotes ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="relative w-full max-w-[860px] animate-[patchNotePop_180ms_ease-out]">
            <div className="absolute inset-x-6 top-4 h-full translate-y-3 rounded-[2.5rem] bg-black/40 blur-2xl" />
            <div className="relative max-h-[82vh] overflow-hidden rounded-[2rem] border-2 border-[#7c6846] bg-[#f7e5b7] text-[#2f2414] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
              <div className="border-b border-[#8f7a54] bg-[linear-gradient(180deg,#fbefcc,#f3dea3)] px-7 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] opacity-70">
                      Workshop Board
                    </p>
                    <h2 className="mt-1 text-3xl font-black">Patch Notes</h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border-2 border-[#2f2414] bg-[#fff8df] px-4 py-2 text-sm font-bold shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    onClick={() => setActivePatchNotes(null)}
                  >
                    닫기
                  </button>
                </div>
              </div>
              <div className="max-h-[calc(82vh-96px)] overflow-y-auto px-7 py-6">
                <div className="space-y-4">
                  {activePatchNotes.length === 0 ? (
                    <p className="rounded-2xl border border-[#c8b07d] bg-[#fff7e2] px-4 py-5 text-center text-base">
                      아직 표시할 패치내역이 없습니다.
                    </p>
                  ) : (
                    activePatchNotes.map((note) => (
                      <article
                        key={note.id}
                        className="rounded-[1.4rem] border border-[#ccb27b] bg-[#fff9ea] px-5 py-4 shadow-[0_8px_20px_rgba(80,58,20,0.08)]"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-xl font-extrabold">{note.title}</h3>
                          <p className="shrink-0 text-sm font-semibold opacity-70">{note.date}</p>
                        </div>
                        <p className="mt-2 text-[15px] leading-7">{note.summary}</p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] leading-6">
                          {note.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes patchNotePop {
              0% {
                opacity: 0;
                transform: scale(0.92) translateY(16px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}</style>
        </div>
      ) : null}
    </div>
  );
}
