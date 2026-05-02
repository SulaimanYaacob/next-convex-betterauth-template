"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameHud } from "@/components/games/game-hud";
import { GameStartOverlay } from "@/components/games/game-start-overlay";
import { GameSurface } from "@/components/games/game-surface";
import { usePlatformPause } from "@/hooks/use-platform-pause";
import { postGameMessage } from "@/lib/game-messages";

const TILE_COUNT = 16;
const EMPTY_TILE_STATES = Array.from({ length: TILE_COUNT }, () => "idle" as const);

type TileState = "idle" | "active" | "wrong";

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function MindMazePage() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [tileStates, setTileStates] = useState<TileState[]>(EMPTY_TILE_STATES);
  const pausedRef = useRef(false);
  const endedRef = useRef(false);
  const sequenceRef = useRef<number[]>([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  usePlatformPause(
    () => setPaused(true),
    () => setPaused(false),
  );

  async function flash(index: number, state: TileState = "active") {
    setTileStates((current) =>
      current.map((value, tileIndex) => (tileIndex === index ? state : value)),
    );
    await sleep(280);
    setTileStates((current) =>
      current.map((value, tileIndex) => (tileIndex === index ? "idle" : value)),
    );
  }

  const showSequence = useCallback(async (route: number[]) => {
    setAccepting(false);
    await sleep(420);
    for (const index of route) {
      while (pausedRef.current) await sleep(80);
      if (endedRef.current) return;
      await flash(index);
      await sleep(120);
    }
    setInput([]);
    setAccepting(true);
  }, []);

  const nextRound = useCallback(
    (route?: number[]) => {
      const nextRoute = [
        ...(route ?? sequenceRef.current),
        Math.floor(Math.random() * TILE_COUNT),
      ];
      sequenceRef.current = nextRoute;
      setSequence(nextRoute);
      setRound(nextRoute.length);
      void showSequence(nextRoute);
    },
    [showSequence],
  );

  function start() {
    endedRef.current = false;
    const firstRoute = [Math.floor(Math.random() * TILE_COUNT)];
    sequenceRef.current = firstRoute;
    setRunning(true);
    setPaused(false);
    setAccepting(false);
    setScore(0);
    setRound(1);
    setLives(3);
    setInput([]);
    setSequence(firstRoute);
    setTileStates(EMPTY_TILE_STATES);
    postGameMessage("mind-maze", "GAME_STARTED");
    postGameMessage("mind-maze", "SCORE_UPDATE", { score: 0 });
    void showSequence(firstRoute);
  }

  function finish(finalScore: number) {
    if (endedRef.current) return;
    endedRef.current = true;
    setRunning(false);
    setAccepting(false);
    postGameMessage("mind-maze", "GAME_OVER", { score: finalScore });
  }

  async function choose(index: number) {
    if (!running || !accepting || paused || endedRef.current) return;
    setAccepting(false);
    const nextInput = [...input, index];
    const expected = sequenceRef.current[nextInput.length - 1];

    if (index !== expected) {
      const nextLives = lives - 1;
      setLives(nextLives);
      setInput([]);
      await flash(index, "wrong");
      if (nextLives <= 0) {
        finish(score);
        return;
      }
      void showSequence(sequenceRef.current);
      return;
    }

    const nextScore = score + 35 + round * 8;
    setScore(nextScore);
    postGameMessage("mind-maze", "SCORE_UPDATE", { score: nextScore });
    setInput(nextInput);
    await flash(index);

    if (nextInput.length === sequenceRef.current.length) {
      nextRound(sequenceRef.current);
    } else {
      setAccepting(true);
    }
  }

  return (
    <GameSurface className="font-mono" grid>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(105,185,176,.15),transparent_24rem),radial-gradient(circle_at_78%_72%,rgba(230,132,69,.12),transparent_26rem)]" />

      {running && (
        <GameHud
          columns={3}
          stats={[
            ["Score", score.toLocaleString()],
            ["Round", String(round)],
            ["Lives", String(lives)],
          ]}
        />
      )}

      <div className="relative z-10 grid h-full place-items-center p-4">
        <div
          className={[
            "grid aspect-square gap-2 sm:gap-3",
            !running && "opacity-55 blur-[1px]",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            width: "min(calc(100vw - 32px), calc(100svh - 120px), 620px)",
          }}
          aria-label="Mind Maze tiles"
        >
          {Array.from({ length: TILE_COUNT }, (_, index) => {
            const state = tileStates[index];
            return (
              <button
                key={index}
                type="button"
                aria-label={`Tile ${index + 1}`}
                aria-disabled={!accepting}
                disabled={!accepting}
                onClick={() => void choose(index)}
                className={[
                  "aspect-square rounded-md border-2 transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90",
                  accepting
                    ? "cursor-pointer border-[#4a4b52] bg-[#202126] hover:border-[#69b9b0]/80 hover:bg-[#272a2f]"
                    : "cursor-default border-[#34363c] bg-[#1b1c20]",
                  state === "active" &&
                    "!border-[#69b9b0] !bg-[#69b9b0] shadow-[0_0_34px_rgba(105,185,176,.48)]",
                  state === "wrong" &&
                    "!border-[#f05f57] !bg-[#f05f57] shadow-[0_0_34px_rgba(240,95,87,.48)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            );
          })}
        </div>
      </div>

      {!running && !endedRef.current && (
        <GameStartOverlay
          title="Mind Maze"
          description="Memorize each glowing route and repeat it as the sequence grows."
          buttonLabel="Start puzzle"
          accentClassName="bg-[#69b9b0]"
          onStart={start}
        />
      )}

      {running && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-center text-xs text-white/65 backdrop-blur">
          {accepting ? "Repeat the route" : "Watch the route"}
        </div>
      )}
    </GameSurface>
  );
}
