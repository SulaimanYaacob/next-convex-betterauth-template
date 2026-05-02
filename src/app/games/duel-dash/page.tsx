"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GameStartOverlay } from "@/components/games/game-start-overlay";
import { GameSurface } from "@/components/games/game-surface";
import { usePlatformPause } from "@/hooks/use-platform-pause";
import { postGameMessage } from "@/lib/game-messages";
import { canUseSkillInMode, getEquippedSkill } from "@/lib/skills";
import { appearanceFromSlugs } from "@/lib/player-avatar";
import { SkillEffect } from "@/lib/cosmetics";

type Phase = "idle" | "waiting" | "countdown" | "playing" | "ended";
type Player = {
  id: string;
  displayName: string;
  x: number;
  y: number;
  score: number;
  downed: boolean;
  recovery: number;
  lastSeen: number;
  playerShape?: string;
  playerColor?: string;
  playerEffect?: string;
  skillPrimary?: string;
  skillEffect?: string;
  skillUntil?: number;
};
type Hazard = { id: string; x: number; y: number; r: number; vx: number; vy: number };
type Signal = { x: number; y: number; value: number };
type TicketPayload = {
  userId: string;
  displayName: string;
  expiresAt: number;
  playerShape?: string;
  playerColor?: string;
  playerEffect?: string;
  skillPrimary?: string;
};

const ROUND_MS = 60_000;
const COUNTDOWN_MS = 3500;
const PLAYER_RADIUS = 0.032;

function clamp(value: number, min = 0.04, max = 0.96) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomSignal(): Signal {
  return {
    x: Math.random() * 0.82 + 0.09,
    y: Math.random() * 0.7 + 0.2,
    value: Math.random() < 0.18 ? 18 : 10,
  };
}

function randomHazards(): Hazard[] {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `h-${index}`,
    x: Math.random() * 0.78 + 0.11,
    y: Math.random() * 0.58 + 0.28,
    r: Math.random() * 0.012 + 0.026,
    vx: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.018 + 0.01),
    vy: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.014 + 0.008),
  }));
}

function hazardPosition(hazard: Hazard, startedAt: number, now: number) {
  const t = (now - startedAt) / 1000;
  return {
    x: clamp(hazard.x + Math.sin(t * 0.82 + hazard.x * 9) * hazard.vx, 0.08, 0.92),
    y: clamp(hazard.y + Math.cos(t * 0.76 + hazard.y * 9) * hazard.vy, 0.18, 0.9),
  };
}

function skillTone(effect?: SkillEffect) {
  if (effect === "boost") return "#69b9b0";
  if (effect === "shield") return "#78d6ff";
  if (effect === "magnet") return "#f8d36a";
  if (effect === "stunner") return "#e68445";
  if (effect === "slowmo") return "#8fa8ff";
  return "#f8f6f2";
}

function SkillAura({ effect }: { effect?: SkillEffect }) {
  if (!effect) return null;

  if (effect === "boost") {
    return (
      <>
        <span className="absolute left-1/2 top-1/2 h-2 w-16 -translate-x-[88%] -translate-y-1/2 rounded-full bg-[#69b9b0]/40 blur-sm" />
        <span className="absolute left-1/2 top-1/2 h-1 w-11 -translate-x-[86%] translate-y-2 rounded-full bg-[#69b9b0]/65" />
      </>
    );
  }

  if (effect === "shield") {
    return (
      <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#78d6ff]/70 bg-[#78d6ff]/10 shadow-[0_0_28px_rgba(120,214,255,.5)]" />
    );
  }

  if (effect === "magnet") {
    return (
      <span className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#f8d36a]/70 shadow-[0_0_24px_rgba(248,211,106,.36)]" />
    );
  }

  if (effect === "stunner") {
    return (
      <span className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#e68445]/60 bg-[#e68445]/10 shadow-[0_0_32px_rgba(230,132,69,.42)]" />
    );
  }

  return (
    <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8fa8ff]/65 bg-[#8fa8ff]/10 shadow-[0_0_26px_rgba(143,168,255,.42)]" />
  );
}

function PlayerToken({ player, viewerId, now }: { player: Player; viewerId: string; now: number }) {
  const appearance = appearanceFromSlugs(player);
  const active = player.skillUntil && player.skillUntil > now ? player.skillEffect as SkillEffect : undefined;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${player.x * 100}%`,
        top: `${player.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <SkillAura effect={active} />
      <span
        className={[
          "relative block size-8 border-2 shadow-lg",
          appearance.shape === "diamond" && "rotate-45 rounded-sm",
          appearance.shape === "rounded-square" && "rounded-md",
          appearance.shape === "orb" && "rounded-full",
          player.downed && "grayscale",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background: player.downed ? "#c9c3bd" : appearance.fill,
          borderColor: player.downed ? "#f05f57" : appearance.stroke,
          boxShadow: active
            ? `0 0 24px ${skillTone(active)}`
            : `0 0 22px ${appearance.glow}`,
        }}
      />
      <span className="absolute left-1/2 top-9 max-w-28 -translate-x-1/2 truncate rounded bg-black/55 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur">
        {player.id === viewerId ? "You" : player.displayName}
      </span>
      {player.downed && (
        <span className="absolute left-1/2 -top-8 h-1.5 w-14 -translate-x-1/2 overflow-hidden rounded-full bg-white/20">
          <span
            className="block h-full bg-[#f8d36a]"
            style={{ width: `${Math.round(player.recovery * 100)}%` }}
          />
        </span>
      )}
    </div>
  );
}

export default function SignalClashPage() {
  const issueTicket = useMutation(api.signalClash.issueTicket);
  const [viewerId] = useState(() => crypto.randomUUID());
  const [playerId, setPlayerId] = useState(viewerId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [signal, setSignal] = useState<Signal>(() => randomSignal());
  const [hazards] = useState<Hazard[]>(() => randomHazards());
  const [countdownEndsAt, setCountdownEndsAt] = useState(0);
  const [roundEndsAt, setRoundEndsAt] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [ticketPayload, setTicketPayload] = useState<TicketPayload | null>(null);
  const [skillCooldownUntil, setSkillCooldownUntil] = useState(0);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const postedStartRef = useRef(false);
  const postedEndRef = useRef(false);

  const viewer = players.find((player) => player.id === playerId) ?? null;
  const skill = useMemo(
    () => getEquippedSkill({ skill_primary: ticketPayload?.skillPrimary }),
    [ticketPayload?.skillPrimary],
  );
  const livePlayers = players.filter((player) => now - player.lastSeen < 6000);
  const sortedPlayers = [...livePlayers].sort((a, b) => b.score - a.score);

  usePlatformPause(
    () => setPaused(true),
    () => setPaused(false),
  );

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SIGNAL_CLASH_WS_URL;
    const channel = new BroadcastChannel("gami-signal-clash-local");
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const message = event.data;
      if (message?.type === "player") {
        setPlayers((current) => mergePlayer(current, message.player));
      }
      if (message?.type === "signal") setSignal(message.signal);
      if (message?.type === "phase") {
        setPhase(message.phase);
        setCountdownEndsAt(message.countdownEndsAt ?? 0);
        setRoundEndsAt(message.roundEndsAt ?? 0);
        setStartedAt(message.startedAt ?? Date.now());
      }
    };

    if (url) {
      const socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type !== "state") return;
        setPlayers(
          (message.players ?? []).map((player: Player) => ({
            ...player,
            lastSeen: player.lastSeen ?? Date.now(),
          })),
        );
        setPhase(message.match?.phase ?? "waiting");
        setSignal(message.match?.signal ?? randomSignal());
        setCountdownEndsAt(message.match?.countdownEndsAt ?? 0);
        setRoundEndsAt(message.match?.endsAt ?? 0);
        setStartedAt(message.match?.startedAt ?? Date.now());
      };
    }

    return () => {
      channel.close();
      socketRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (phase === "countdown" && countdownEndsAt > 0 && now >= countdownEndsAt) {
      startRound();
    }
    if (phase === "playing" && roundEndsAt > 0 && now >= roundEndsAt) {
      setPhase("ended");
    }
  }, [countdownEndsAt, now, phase, roundEndsAt]);

  useEffect(() => {
    if (phase === "playing" && !postedStartRef.current) {
      postedStartRef.current = true;
      postGameMessage("duel-dash", "GAME_STARTED");
    }
    if (viewer) postGameMessage("duel-dash", "SCORE_UPDATE", { score: viewer.score * 18 });
    if (phase === "ended" && !postedEndRef.current) {
      postedEndRef.current = true;
      postGameMessage("duel-dash", "GAME_OVER", { score: (viewer?.score ?? 0) * 18 });
    }
  }, [phase, viewer]);

  async function join() {
    const ticket = await issueTicket();
    const payload: TicketPayload = ticket?.payload ?? {
      userId: viewerId,
      displayName: "Guest",
      expiresAt: Date.now() + 120000,
    };
    setPlayerId(payload.userId);
    setTicketPayload(payload);
    const player: Player = {
      id: payload.userId,
      displayName: payload.displayName,
      x: Math.random() * 0.5 + 0.25,
      y: 0.72,
      score: 0,
      downed: false,
      recovery: 0,
      lastSeen: Date.now(),
      playerShape: payload.playerShape,
      playerColor: payload.playerColor,
      playerEffect: payload.playerEffect,
      skillPrimary: payload.skillPrimary,
    };
    setPlayers((current) => mergePlayer(current, player));
    setPhase("waiting");
    send({ type: "join", ticket: ticket?.ticket });
    broadcastPlayer(player);
  }

  function maybeCountdown(nextPlayers: Player[]) {
    if (phase !== "waiting" || nextPlayers.filter((p) => now - p.lastSeen < 6000).length < 2) return;
    const endsAt = Date.now() + COUNTDOWN_MS;
    setPhase("countdown");
    setCountdownEndsAt(endsAt);
    sendPhase("countdown", { countdownEndsAt: endsAt });
  }

  function startRound() {
    const start = Date.now();
    setStartedAt(start);
    setRoundEndsAt(start + ROUND_MS);
    setPhase("playing");
    sendPhase("playing", { startedAt: start, roundEndsAt: start + ROUND_MS });
  }

  function updateViewerPatch(patch: Partial<Player>) {
    setPlayers((current) => {
      const next = current.map((player) =>
        player.id === playerId
          ? { ...player, ...patch, lastSeen: Date.now() }
          : player,
      );
      const viewerPlayer = next.find((player) => player.id === playerId);
      if (viewerPlayer) broadcastPlayer(viewerPlayer);
      maybeCountdown(next);
      return next;
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (paused || phase !== "playing" || viewer?.downed) return;
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const targetX = clamp((event.clientX - rect.left) / rect.width);
    const targetY = clamp((event.clientY - rect.top) / rect.height, 0.13, 0.94);
    const activeSkill = viewer?.skillUntil && viewer.skillUntil > now ? viewer.skillEffect : null;
    const movementFactor = activeSkill === "boost" ? 1 : 0.58;
    const x = viewer ? viewer.x + (targetX - viewer.x) * movementFactor : targetX;
    const y = viewer ? viewer.y + (targetY - viewer.y) * movementFactor : targetY;
    const signalRange = activeSkill === "magnet" ? 0.13 : 0.058;
    const signalHit = distance({ x, y }, signal) < signalRange;
    const protectedBySkill =
      activeSkill === "shield" || activeSkill === "stunner";
    const hazardHit = !protectedBySkill && hazards.some((hazard) => {
      const pos = hazardPosition(hazard, startedAt, now);
      return distance({ x, y }, pos) < hazard.r + PLAYER_RADIUS;
    });

    if (signalHit) {
      const nextSignal = randomSignal();
      setSignal(nextSignal);
      channelRef.current?.postMessage({ type: "signal", signal: nextSignal });
    } else if (activeSkill === "magnet") {
      const dx = x - signal.x;
      const dy = y - signal.y;
      const pullDistance = Math.hypot(dx, dy) || 1;
      if (pullDistance < 0.34) {
        const nextSignal = {
          ...signal,
          x: clamp(signal.x + (dx / pullDistance) * 0.018, 0.08, 0.92),
          y: clamp(signal.y + (dy / pullDistance) * 0.018, 0.18, 0.9),
        };
        setSignal(nextSignal);
        channelRef.current?.postMessage({ type: "signal", signal: nextSignal });
      }
    }

    updateViewerPatch({
      x,
      y,
      score: (viewer?.score ?? 0) + (signalHit ? signal.value : 0),
      downed: hazardHit,
      recovery: hazardHit ? 0 : viewer?.recovery ?? 0,
    });
    send({ type: "move", x, y });
  }

  function primaryAction() {
    if (!viewer || phase !== "playing") return;
    if (viewer.downed) {
      const recovery = Math.min(1, viewer.recovery + 0.18);
      updateViewerPatch({
        recovery,
        downed: recovery < 1,
      });
      send({ type: "recover" });
      return;
    }

    if (!skill || !canUseSkillInMode(skill, "multiplayer") || skillCooldownUntil > now) return;
    const skillUntil = Date.now() + skill.durationMs;
    setSkillCooldownUntil(Date.now() + skill.cooldownMs);
    updateViewerPatch({
      skillEffect: skill.effect,
      skillUntil,
    });
    send({ type: "skill", effect: skill.effect, durationMs: skill.durationMs });
  }

  function send(message: Record<string, unknown>) {
    socketRef.current?.readyState === WebSocket.OPEN
      ? socketRef.current.send(JSON.stringify(message))
      : null;
  }

  function sendPhase(nextPhase: Phase, extra: Record<string, unknown>) {
    channelRef.current?.postMessage({ type: "phase", phase: nextPhase, ...extra });
  }

  function broadcastPlayer(player: Player) {
    channelRef.current?.postMessage({ type: "player", player });
  }

  const viewerActiveSkill =
    viewer?.skillUntil && viewer.skillUntil > now ? viewer.skillEffect as SkillEffect : undefined;

  return (
    <GameSurface>
      <div
        ref={arenaRef}
        onPointerMove={handlePointerMove}
        onPointerDown={primaryAction}
        className="relative h-full w-full touch-none overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(105,185,176,.16),transparent_22rem),radial-gradient(circle_at_82%_72%,rgba(230,132,69,.14),transparent_24rem),linear-gradient(180deg,#151519_0%,#0f1013_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(248,246,242,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(248,246,242,.8)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-wrap gap-2">
          <span className="rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs backdrop-blur">
            You <strong className="ml-2 text-[#69b9b0]">{viewer?.score ?? 0}</strong>
          </span>
          <span className="rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs backdrop-blur">
            {phase === "countdown"
              ? `Start ${Math.max(1, Math.ceil((countdownEndsAt - now) / 1000))}`
              : phase === "playing"
                ? `Time ${Math.max(0, Math.ceil((roundEndsAt - now) / 1000))}`
                : `${livePlayers.length}/2 ready`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLeaderboardOpen((value) => !value)}
          className="absolute right-3 top-3 z-40 rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs font-semibold text-white/75 backdrop-blur"
        >
          Board
        </button>
        {leaderboardOpen && (
          <aside className="absolute right-3 top-14 z-40 w-48 rounded-md border border-white/10 bg-black/65 p-3 text-xs text-white/75 backdrop-blur">
            {sortedPlayers.slice(0, 5).map((player, index) => (
              <div key={player.id} className="grid grid-cols-[20px_1fr_auto] gap-2 py-1">
                <span>{index + 1}</span>
                <span className="truncate">{player.id === playerId ? "You" : player.displayName}</span>
                <span>{player.score}</span>
              </div>
            ))}
          </aside>
        )}

        {phase === "playing" && (
          <span
            className="pointer-events-none absolute z-10 rounded-full border border-white/80 bg-[#f8d36a] shadow-[0_0_34px_rgba(248,211,106,.5)]"
            style={{
              left: `${signal.x * 100}%`,
              top: `${signal.y * 100}%`,
              width: "42px",
              height: "42px",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {phase === "playing" &&
          hazards.map((hazard) => {
            const pos = hazardPosition(hazard, startedAt, now);
            const stunned =
              viewerActiveSkill === "stunner" && viewer
                ? distance(viewer, pos) < 0.22
                : false;
            return (
              <span
                key={hazard.id}
                className={[
                  "pointer-events-none absolute z-10 rounded-full border shadow-[0_0_28px_rgba(240,95,87,.42)]",
                  stunned
                    ? "border-[#e68445]/75 bg-[#e68445]/25"
                    : "border-[#f05f57]/80 bg-[#f05f57]/55",
                ].join(" ")}
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  width: `${hazard.r * 180}vmin`,
                  height: `${hazard.r * 180}vmin`,
                  minWidth: 32,
                  minHeight: 32,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}

        {livePlayers.map((player) => (
          <PlayerToken key={player.id} player={player} viewerId={playerId} now={now} />
        ))}

        {phase === "idle" && (
          <GameStartOverlay
            title="Signal Clash"
            description="Move like Pixel Rush, collect signals by touching them, and survive hazards with another player."
            buttonLabel="Find match"
            accentClassName="bg-[#f8d36a]"
            onStart={() => void join()}
          />
        )}

        {phase === "waiting" && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 p-5">
            <section className="w-[min(420px,100%)] rounded-md border border-white/15 bg-[#101012]/95 p-6 text-center shadow-2xl">
              <h1 className="text-2xl font-semibold">Waiting for player</h1>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Signal Clash starts when at least 2 active players are in the room.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#f8d36a]">
                {livePlayers.length}/2 ready
              </p>
            </section>
          </div>
        )}

        {phase === "countdown" && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/25">
            <p className="rounded-md border border-white/10 bg-black/55 px-6 py-4 text-4xl font-bold text-white backdrop-blur">
              {Math.max(1, Math.ceil((countdownEndsAt - now) / 1000))}
            </p>
          </div>
        )}

        {viewer?.downed && (
          <div className="absolute bottom-5 left-1/2 z-40 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 rounded-md border border-white/10 bg-black/65 p-3 text-center backdrop-blur">
            <p className="text-sm font-semibold text-white">Click repeatedly to recover</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <span className="block h-full bg-[#f8d36a]" style={{ width: `${viewer.recovery * 100}%` }} />
            </div>
          </div>
        )}

        {phase === "playing" && !viewer?.downed && (
          <button
            type="button"
            onClick={primaryAction}
            className="absolute bottom-4 right-4 z-30 min-h-11 rounded-md border border-white/10 bg-black/55 px-4 text-sm font-semibold text-white/80 backdrop-blur"
          >
            {!skill
              ? "No skill"
              : viewerActiveSkill
                ? `${skill.label} active`
                : skillCooldownUntil > now
                ? "Charging"
                : skill.label}
          </button>
        )}

        {phase === "ended" && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-5">
            <section className="w-[min(420px,100%)] rounded-md border border-white/15 bg-[#101012]/95 p-6 text-center shadow-2xl">
              <h1 className="text-2xl font-semibold">Round complete</h1>
              <p className="mt-3 text-sm text-white/65">
                {sortedPlayers[0]
                  ? `${sortedPlayers[0].displayName} led with ${sortedPlayers[0].score} signals.`
                  : "No winner this round."}
              </p>
            </section>
          </div>
        )}

        {paused && phase === "playing" && (
          <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/45">
            <p className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm text-white/75">
              Paused
            </p>
          </div>
        )}
      </div>
    </GameSurface>
  );
}

function mergePlayer(players: Player[], player: Player) {
  const exists = players.some((candidate) => candidate.id === player.id);
  if (!exists) return [...players, player];
  return players.map((candidate) => (candidate.id === player.id ? player : candidate));
}
