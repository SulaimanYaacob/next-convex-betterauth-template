import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Application user record — merged with Better Auth user via getCurrentUser
  users: defineTable({
    email: v.string(),
    userId: v.optional(v.string()),    // Better Auth user id (string, not Convex Id)
    username: v.optional(v.string()),  // populated in Phase 4 — Claude's Discretion
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  // ECON-01: append-only ledger — balance = SUM(amount). NO mutable balance field anywhere.
  coinLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),                // signed: positive credit, negative debit
    reason: v.string(),                // e.g. "game_earn", "purchase", "stripe_topup"
    sessionId: v.optional(v.string()), // game session reference for ECON-02
  }).index("by_userId", ["userId"]),

  // PRES-01: separate from users — heartbeat writes never invalidate users doc subscribers
  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),              // Unix ms timestamp
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
      v.literal("idle"),
      v.literal("offline"),
    ),
  }).index("by_userId", ["userId"]),

  // Catalog — populated in Phase 4
  storeItems: defineTable({
    slug: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("cursor_skin"),
      v.literal("cursor_trail"),
      v.literal("ui_theme"),
    ),
    price: v.number(),
    rarity: v.union(
      v.literal("common"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary"),
    ),
    previewUrl: v.optional(v.string()),
    earnedOnly: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type"]),

  // Phase 4 — items owned by users
  ownedItems: defineTable({
    userId: v.id("users"),
    itemId: v.id("storeItems"),
    acquiredAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_itemId", ["userId", "itemId"]),

  // Phase 4 — currently equipped per slot
  equippedItems: defineTable({
    userId: v.id("users"),
    slot: v.union(
      v.literal("cursor_skin"),
      v.literal("cursor_trail"),
      v.literal("ui_theme"),
    ),
    itemId: v.id("storeItems"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_slot", ["userId", "slot"]),

  // Phase 3 — game session log
  games: defineTable({
    userId: v.id("users"),
    gameId: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    scoreEvent: v.optional(v.any()),
    coinsAwarded: v.optional(v.number()),
    sessionCap: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_gameId", ["userId", "gameId"]),
});
