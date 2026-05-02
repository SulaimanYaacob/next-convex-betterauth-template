import { v } from "convex/values";
import { MutationCtx, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAppUser, getPlayerLoadout, userDisplayName } from "./authUsers";

const ROUND_MS = 60_000;
const ACTIVE_WINDOW_MS = 20_000;
const STUN_MS = 2_400;
const PLAYER_RADIUS = 0.032;
const COLORS = ["#69b9b0", "#e68445", "#f8d36a", "#8f7bff", "#f05f57"];

type Hazard = {
  id: string;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
};

function roundKey(now: number) {
  return String(Math.floor(now / ROUND_MS));
}

function roundBounds(now: number) {
  const startedAt = Math.floor(now / ROUND_MS) * ROUND_MS;
  return { startedAt, endsAt: startedAt + ROUND_MS };
}

function clamp(value: number, min = 0.06, max = 0.94) {
  return Math.min(max, Math.max(min, value));
}

function randomTarget() {
  return {
    targetX: Math.random() * 0.78 + 0.11,
    targetY: Math.random() * 0.68 + 0.22,
    targetSize: Math.random() * 0.035 + 0.035,
    targetValue: Math.random() < 0.18 ? 18 : 10,
  };
}

function randomHazards(): Hazard[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `h-${index}-${Math.round(Math.random() * 10000)}`,
    x: Math.random() * 0.72 + 0.14,
    y: Math.random() * 0.52 + 0.28,
    r: Math.random() * 0.012 + 0.035,
    vx: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.018 + 0.01),
    vy: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.014 + 0.008),
  }));
}

function colorForUser(userId: Id<"users">) {
  let hash = 0;
  for (const char of userId) hash += char.charCodeAt(0);
  return COLORS[hash % COLORS.length];
}

function hazardPosition(hazard: Hazard, roundStartedAt: number, now: number) {
  const t = (now - roundStartedAt) / 1000;
  return {
    x: clamp(hazard.x + Math.sin(t * 0.8 + hazard.x * 9) * hazard.vx, 0.08, 0.92),
    y: clamp(hazard.y + Math.cos(t * 0.72 + hazard.y * 9) * hazard.vy, 0.18, 0.9),
  };
}

function touchesHazard(
  hazards: Hazard[],
  roundStartedAt: number,
  now: number,
  x: number,
  y: number,
) {
  return hazards.some((hazard) => {
    const pos = hazardPosition(hazard, roundStartedAt, now);
    return Math.hypot(x - pos.x, y - pos.y) <= hazard.r + PLAYER_RADIUS;
  });
}

async function getOrCreateRound(ctx: MutationCtx, now: number) {
  const key = roundKey(now);
  const existing = await ctx.db
    .query("duelDashRounds")
    .withIndex("by_roundKey", (q) => q.eq("roundKey", key))
    .unique();
  if (existing) {
    if (!Array.isArray(existing.hazards)) {
      await ctx.db.patch(existing._id, { hazards: randomHazards() });
      const patched = await ctx.db.get(existing._id);
      if (patched) return patched;
    }
    return existing;
  }

  const bounds = roundBounds(now);
  const target = randomTarget();
  const roundId = await ctx.db.insert("duelDashRounds", {
    roundKey: key,
    startedAt: bounds.startedAt,
    endsAt: bounds.endsAt,
    targetVersion: 1,
    hazards: randomHazards(),
    updatedAt: now,
    ...target,
  });
  const round = await ctx.db.get(roundId);
  if (!round) throw new Error("Round creation failed.");
  return round;
}

export const joinCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return null;

    const now = Date.now();
    const round = await getOrCreateRound(ctx, now);
    const loadout = await getPlayerLoadout(ctx, user._id);
    const existing = await ctx.db
      .query("duelDashPlayers")
      .withIndex("by_roundId_and_userId", (q) =>
        q.eq("roundId", round._id).eq("userId", user._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: userDisplayName(user),
        lastSeen: now,
        x: existing.x ?? 0.5,
        y: existing.y ?? 0.56,
        immobilizedUntil: existing.immobilizedUntil ?? 0,
        ...loadout,
      });
      return { roundId: round._id, playerId: existing._id, endsAt: round.endsAt };
    }

    const playerId = await ctx.db.insert("duelDashPlayers", {
      roundId: round._id,
      userId: user._id,
      displayName: userDisplayName(user),
      color: colorForUser(user._id),
      x: Math.random() * 0.5 + 0.25,
      y: Math.random() * 0.18 + 0.68,
      immobilizedUntil: 0,
      ...loadout,
      score: 0,
      streak: 0,
      misses: 0,
      joinedAt: now,
      lastSeen: now,
    });

    return { roundId: round._id, playerId, endsAt: round.endsAt };
  },
});

export const heartbeat = mutation({
  args: { roundId: v.id("duelDashRounds") },
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (!user) return null;
    const player = await ctx.db
      .query("duelDashPlayers")
      .withIndex("by_roundId_and_userId", (q) =>
        q.eq("roundId", args.roundId).eq("userId", user._id),
      )
      .first();
    if (!player) return null;
    const loadout = await getPlayerLoadout(ctx, user._id);
    await ctx.db.patch(player._id, { lastSeen: Date.now(), ...loadout });
    return player._id;
  },
});

export const updatePosition = mutation({
  args: {
    roundId: v.id("duelDashRounds"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (!user) return null;

    const [round, player] = await Promise.all([
      ctx.db.get(args.roundId),
      ctx.db
        .query("duelDashPlayers")
        .withIndex("by_roundId_and_userId", (q) =>
          q.eq("roundId", args.roundId).eq("userId", user._id),
        )
        .first(),
    ]);
    if (!round || !player) return null;

    const now = Date.now();
    if (now >= round.endsAt) return { status: "ended" as const };
    if ((player.immobilizedUntil ?? 0) > now) {
      await ctx.db.patch(player._id, { lastSeen: now });
      return { status: "stunned" as const, immobilizedUntil: player.immobilizedUntil ?? 0 };
    }

    const x = clamp(args.x);
    const y = clamp(args.y, 0.16, 0.92);
    const hitHazard = touchesHazard(round.hazards ?? [], round.startedAt, now, x, y);
    const patch = hitHazard
      ? {
          x,
          y,
          streak: 0,
          immobilizedUntil: now + STUN_MS,
          lastSeen: now,
        }
      : { x, y, lastSeen: now };

    await ctx.db.patch(player._id, patch);
    return hitHazard
      ? { status: "stunned" as const, immobilizedUntil: now + STUN_MS }
      : { status: "moved" as const };
  },
});

export const getRound = query({
  args: { roundId: v.id("duelDashRounds") },
  handler: async (ctx, args) => {
    const [round, user] = await Promise.all([
      ctx.db.get(args.roundId),
      getAppUser(ctx),
    ]);
    if (!round) return null;

    const now = Date.now();
    const rows = await ctx.db
      .query("duelDashPlayers")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .take(50);

    const activeRows = rows.filter((row) => now - row.lastSeen <= ACTIVE_WINDOW_MS);
    const sortedRows = [...activeRows].sort(
      (a, b) => b.score - a.score || a.joinedAt - b.joinedAt,
    );
    const rankById = new Map(sortedRows.map((row, index) => [row._id, index + 1]));

    const players = activeRows.map((row) => ({
      playerId: row._id,
      displayName: row.displayName,
      color: row.color,
      x: row.x ?? 0.5,
      y: row.y ?? 0.56,
      immobilizedUntil: row.immobilizedUntil ?? 0,
      playerShape: row.playerShape,
      playerColor: row.playerColor,
      playerEffect: row.playerEffect,
      score: row.score,
      streak: row.streak,
      misses: row.misses,
      rank: rankById.get(row._id) ?? 99,
      isViewer: user?._id === row.userId,
    }));

    return {
      round: {
        id: round._id,
        startedAt: round.startedAt,
        endsAt: round.endsAt,
        targetX: round.targetX,
        targetY: round.targetY,
        targetSize: round.targetSize,
        targetValue: round.targetValue,
        targetVersion: round.targetVersion,
        hazards: round.hazards ?? [],
      },
      players,
      viewerPlayerId:
        user === null
          ? null
          : rows.find((row) => row.userId === user._id)?._id ?? null,
    };
  },
});

export const hitTarget = mutation({
  args: {
    roundId: v.id("duelDashRounds"),
    x: v.number(),
    y: v.number(),
    targetVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (!user) return null;

    const [round, player] = await Promise.all([
      ctx.db.get(args.roundId),
      ctx.db
        .query("duelDashPlayers")
        .withIndex("by_roundId_and_userId", (q) =>
          q.eq("roundId", args.roundId).eq("userId", user._id),
        )
        .first(),
    ]);
    if (!round || !player) return null;

    const now = Date.now();
    if (now >= round.endsAt) return { hit: false, score: player.score };
    if ((player.immobilizedUntil ?? 0) > now) {
      return {
        hit: false,
        score: player.score,
        stunned: true,
        immobilizedUntil: player.immobilizedUntil ?? 0,
      };
    }

    const dx = args.x - round.targetX;
    const dy = args.y - round.targetY;
    const radius = round.targetSize * 1.18;
    const hit =
      args.targetVersion === round.targetVersion &&
      Math.hypot(dx, dy) <= radius;

    if (!hit) {
      const score = Math.max(0, player.score - 2);
      await ctx.db.patch(player._id, {
        score,
        streak: 0,
        misses: player.misses + 1,
        lastSeen: now,
      });
      return { hit: false, score };
    }

    const streak = player.streak + 1;
    const bonus = Math.min(8, Math.floor(streak / 3) * 2);
    const score = player.score + round.targetValue + bonus;
    await ctx.db.patch(player._id, { score, streak, lastSeen: now });
    await ctx.db.patch(round._id, {
      ...randomTarget(),
      targetVersion: round.targetVersion + 1,
      updatedAt: now,
    });

    return { hit: true, score };
  },
});
