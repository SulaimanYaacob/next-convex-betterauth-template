"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EquippedMiniBadges } from "@/components/cosmetics/cosmetic-preview";

const STATUS_COLORS: Record<"online" | "in-game", string> = {
  online: "#22c55e",
  "in-game": "oklch(0.5360 0.0398 196.0280)",
};

export function PresencePanel() {
  const players = useQuery(api.presence.getOnlinePlayers);

  // Loading state — Convex undefined
  if (players === undefined) {
    return (
      <div
        className="rounded-md border border-border bg-background/60 p-4"
        aria-label="Loading online players"
      >
        <p className="text-sm font-semibold mb-2">Online now</p>
        <div className="flex flex-row gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="size-10 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (players.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold mb-2">Online now</p>
        <p className="text-sm text-muted-foreground text-center py-4">
          No players online right now
        </p>
      </div>
    );
  }

  // Populated
  return (
    <div className="rounded-md border border-border bg-background/60 p-4">
      <p className="text-sm font-semibold mb-2">Online now</p>
      <div
        role="list"
        className="flex flex-row gap-4 overflow-x-auto pb-1"
      >
        {players.map((player) => (
          <div
            key={player.userId}
            role="listitem"
            aria-label={`${player.name}, ${player.status}`}
            className="flex flex-col items-center gap-1 shrink-0 w-14"
          >
            <div className="relative">
              <Avatar className="size-10">
                <AvatarFallback className="text-xs">
                  {player.initials}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute bottom-0 right-0 size-2 rounded-full ring-2 ring-background"
                style={{ backgroundColor: STATUS_COLORS[player.status] }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {player.name}
            </span>
            <EquippedMiniBadges equipped={player.cosmetics} />
          </div>
        ))}
      </div>
    </div>
  );
}
