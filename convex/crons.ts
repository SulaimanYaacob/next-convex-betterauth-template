import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// PRES-03: every 1 minute, mark presence rows with lastSeen > 5 min ago as "offline".
// Handles tab crashes (no client to send heartbeat). Per D-12.
// Registered as internalMutation — NOT callable from public api.* (T-02-05).
export const markStalePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const STALE_MS = 5 * 60 * 1000;
    const cutoff = Date.now() - STALE_MS;
    // Use .take(100) per Convex guidelines — never .collect()
    const rows = await ctx.db.query("presence").take(100);
    for (const row of rows) {
      if (row.lastSeen < cutoff && row.status !== "offline") {
        await ctx.db.patch(row._id, { status: "offline" });
      }
    }
  },
});

const crons = cronJobs();
crons.interval(
  "mark-stale-presence",
  { minutes: 1 },
  internal.crons.markStalePresence,
  {},
);
export default crons;
