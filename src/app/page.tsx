import { FilterChips } from "@/components/filter-chips";
import { GameCard } from "@/components/game-card";
import { PresencePanel } from "@/components/presence-panel";

const SOLO_GAMES = [
  { name: "Pixel Rush", genre: "Arcade" },
  { name: "Mind Maze", genre: "Puzzle" },
] as const;

const MP_GAMES = [
  { name: "Pixel Rush MP", genre: "Arcade" },
  { name: "Mind Maze Co-op", genre: "Puzzle" },
] as const;

export default function Home() {
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
            {SOLO_GAMES.map((g) => (
              <GameCard key={g.name} name={g.name} genre={g.genre} />
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
            {MP_GAMES.map((g) => (
              <GameCard key={g.name} name={g.name} genre={g.genre} />
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
