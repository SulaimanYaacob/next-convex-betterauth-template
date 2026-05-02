import { mutation } from "./_generated/server";
import { getAppUser, getPlayerLoadout, userDisplayName } from "./authUsers";

async function signPayload(payload: string) {
  const secret = process.env.SIGNAL_CLASH_TICKET_SECRET ?? "dev-signal-clash";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export const issueTicket = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return null;

    const loadout = await getPlayerLoadout(ctx, user._id);
    const expiresAt = Date.now() + 2 * 60_000;
    const payload = {
      userId: user._id,
      displayName: userDisplayName(user),
      expiresAt,
      ...loadout,
    };
    const encoded = btoa(JSON.stringify(payload));
    const signature = await signPayload(encoded);

    return {
      ticket: `${encoded}.${signature}`,
      payload,
    };
  },
});
