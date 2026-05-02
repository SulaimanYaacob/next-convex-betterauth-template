"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FilterChips } from "@/components/filter-chips";
import { GameCard } from "@/components/game-card";
import { PresencePanel } from "@/components/presence-panel";

const GameCardSkeleton = () => (
  <div className="rounded-xl overflow-hidden">
    <div className="aspect-video bg-muted animate-pulse" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
      <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

export default function Home() {
  const allGames = useQuery(api.gameCatalog.list);
  const soloGames = allGames?.filter((g) => !g.isMultiplayer) ?? [];
  const mpGames = allGames?.filter((g) => g.isMultiplayer) ?? [];

  return (
    <>
      <FilterChips />

      <section
        aria-label="Solo games"
        className="py-10 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#f8f6f2" }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">Solo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allGames === undefined
              ? Array.from({ length: 4 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))
              : soloGames.length === 0
              ? (
                  <p className="text-sm text-muted-foreground col-span-full">
                    No games available yet.
                  </p>
                )
              : soloGames.map((g) => (
                  <GameCard
                    key={g._id}
                    name={g.name}
                    genre={g.genre}
                    slug={g.slug}
                    thumbnailUrl={g.thumbnailUrl}
                  />
                ))}
          </div>
        </div>
      </section>

      <section
        aria-label="Multiplayer games"
        className="py-10 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#f1f5fb" }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">
            Multiplayer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allGames === undefined
              ? Array.from({ length: 4 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))
              : mpGames.length === 0
              ? (
                  <p className="text-sm text-muted-foreground col-span-full">
                    No multiplayer games available yet.
                  </p>
                )
              : mpGames.map((g) => (
                  <GameCard
                    key={g._id}
                    name={g.name}
                    genre={g.genre}
                    slug={g.slug}
                    thumbnailUrl={g.thumbnailUrl}
                  />
                ))}
          </div>
          <div className="mt-8">
            <PresencePanel />
          </div>
        </div>
      </section>
    </>
  );
}
