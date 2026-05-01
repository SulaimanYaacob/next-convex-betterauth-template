"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export function CoinBalance() {
  const { data: session } = authClient.useSession();
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)
      ?.isAnonymous === true;

  const balance = useQuery(api.coinLedger.getBalance);

  // D-02: hidden entirely for guests — no placeholder.
  if (!session?.user || isAnonymous) return null;

  // Loading state — Convex undefined = still loading
  if (balance === undefined) {
    return (
      <div
        className="w-16 h-5 bg-muted animate-pulse rounded"
        aria-label="Loading coin balance"
      />
    );
  }

  // Server returned null (no app-user row) — treat as hidden
  if (balance === null) return null;

  return (
    <span
      className="text-sm font-semibold tabular-nums text-foreground"
      aria-label={`Coin balance: ${balance} coins`}
    >
      <span className="text-primary">⟟</span>{" "}
      {balance.toLocaleString()}
    </span>
  );
}
