import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// GAME-01: returns all catalog records, bounded to 100 (never .collect())
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gameCatalog").take(100);
  },
});

// GAME-01: look up a single game by its slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameCatalog")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// GAME-03: seed the local playable catalog idempotently.
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const games = [
      {
        slug: "pixel-rush",
        name: "Pixel Rush",
        iframeUrl: "/games/pixel-rush",
        isMultiplayer: false,
        genre: "Arcade",
        description:
          "Collect bright cores, dodge sharp hazards, and survive the full run.",
        skillSupport: "singleplayer",
      },
      {
        slug: "mind-maze",
        name: "Mind Maze",
        iframeUrl: "/games/mind-maze",
        isMultiplayer: false,
        genre: "Puzzle",
        description:
          "Memorize each glowing route and repeat it as the sequence grows.",
        skillSupport: "none",
      },
      {
        slug: "duel-dash",
        name: "Signal Clash",
        iframeUrl: "/games/duel-dash",
        isMultiplayer: true,
        genre: "Online Versus",
        description:
          "Race online players to collect shared signals while dodging hazards.",
        skillSupport: "multiplayer",
      },
    ] as const;

    for (const game of games) {
      const existing = await ctx.db
        .query("gameCatalog")
        .withIndex("by_slug", (q) => q.eq("slug", game.slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, game);
      } else {
        await ctx.db.insert("gameCatalog", game);
      }
    }
  },
});
