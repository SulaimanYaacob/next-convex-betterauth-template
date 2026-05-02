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

// GAME-03: seed the catalog with Pixel Rush and Mind Maze (idempotent)
// Idempotency: check for "pixel-rush" before inserting either record
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("gameCatalog")
      .withIndex("by_slug", (q) => q.eq("slug", "pixel-rush"))
      .unique();

    if (existing) {
      // Already seeded — do nothing
      return;
    }

    await ctx.db.insert("gameCatalog", {
      slug: "pixel-rush",
      name: "Pixel Rush",
      iframeUrl: "https://placeholder.game/pixel-rush",
      isMultiplayer: false,
      genre: "Arcade",
    });

    await ctx.db.insert("gameCatalog", {
      slug: "mind-maze",
      name: "Mind Maze",
      iframeUrl: "https://placeholder.game/mind-maze",
      isMultiplayer: false,
      genre: "Puzzle",
    });
  },
});
