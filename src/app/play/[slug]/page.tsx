"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { GameIframe } from "@/components/game-iframe";
import { EscOverlay } from "@/components/esc-overlay";
import { FloatingPauseButton } from "@/components/floating-pause-button";
import { RewardScreen } from "@/components/reward-screen";

// Parse ALLOWED_ORIGINS once at module level — stable across renders, no React Compiler issue
const ALLOWED_ORIGINS = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_GAME_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

function GameShellContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const session = authClient.useSession();
  const userId = session.data?.user?.id;

  // Convex queries and mutations
  const game = useQuery(api.gameCatalog.getBySlug, { slug });
  const startSession = useMutation(api.games.startSession);
  const updateScore = useMutation(api.games.updateScore);
  const endSession = useMutation(api.games.endSession);
  const updatePresence = useMutation(api.presence.updatePresence);

  // Local state
  const [escOpen, setEscOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const sessionIdRef = useRef<Id<"games"> | null>(null);

  // Body scroll lock — applied on mount, restored on unmount (per RESEARCH.md Pattern 6)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Keyboard ESC listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !rewardOpen) {
        e.preventDefault();
        setEscOpen((prev) => (hasStarted ? !prev : false));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, rewardOpen]);

  // postMessage handler — single effect, origin-validated
  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      // Origin validation — silent ignore for unlisted origins (per D-13)
      if (
        event.origin !== window.location.origin &&
        !ALLOWED_ORIGINS.has(event.origin)
      ) {
        return;
      }

      const data = event.data as { type?: string; score?: number; gameId?: string };
      if (!data?.type) return;

      switch (data.type) {
        case "GAME_STARTED": {
          setHasStarted(true);
          void updatePresence({ status: "in-game" });
          const newSessionId = await startSession({ gameId: slug });
          if (newSessionId) {
            sessionIdRef.current = newSessionId;
          }
          break;
        }
        case "SCORE_UPDATE": {
          const score = data.score ?? 0;
          setLastScore(score);
          if (sessionIdRef.current) {
            void updateScore({ gameSessionId: sessionIdRef.current, score });
          }
          break;
        }
        case "GAME_OVER": {
          setEscOpen(false);
          setHasStarted(false);
          await handleGameOver(data.score ?? 0);
          break;
        }
        case "GAME_PAUSE_TOGGLE": {
          if (!rewardOpen && hasStarted) setEscOpen((prev) => !prev);
          break;
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [hasStarted, rewardOpen, slug, updatePresence, startSession, updateScore]);

  async function handleGameOver(
    score: number,
    options: { showReward?: boolean } = {},
  ) {
    const showReward = options.showReward ?? true;
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      // Race condition fallback: session hasn't started yet (very fast game)
      // Show reward screen with 0 coins rather than blocking
      if (showReward) {
        setRewardCoins(0);
        setRewardOpen(true);
      }
      return;
    }
    try {
      const earned = await endSession({ gameSessionId: sessionId, score });
      sessionIdRef.current = null;
      if (showReward) setRewardCoins(earned ?? 0);
    } catch {
      toast.error("Couldn't save your coins. Your progress is not lost — contact support.");
      if (showReward) setRewardCoins(0);
    }
    if (showReward) setRewardOpen(true);
  }

  async function quitToLobby() {
    setEscOpen(false);
    setHasStarted(false);
    await handleGameOver(lastScore, { showReward: false });
    void updatePresence({ status: "online" });
    router.push("/");
  }

  // Loading state: gameCatalog query pending
  if (game === undefined) {
    return (
      <div className="fixed inset-0 z-[70] overflow-hidden bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state: slug not found in catalog
  if (game === null) {
    return (
      <div className="fixed inset-0 z-[70] overflow-hidden bg-black flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-semibold text-white">Game not found.</p>
        <p className="text-sm text-muted-foreground">This game doesn&apos;t exist or has been removed.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <main
      className="fixed inset-0 z-[70] overflow-hidden bg-black"
      aria-label={`Game: ${game.name}`}
    >
      <GameIframe
        iframeUrl={game.iframeUrl}
        gameName={game.name}
        userId={userId}
        sessionId={sessionIdRef.current ? sessionIdRef.current.toString() : null}
        paused={escOpen || rewardOpen}
        onEscape={() => {
          if (hasStarted && !rewardOpen) setEscOpen((prev) => !prev);
        }}
        onLoad={() => {/* SESSION_INIT handled inside GameIframe */}}
      />

      {!hasStarted && !escOpen && !rewardOpen && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fixed left-4 top-4 z-[80] inline-flex min-h-[40px] items-center gap-2 rounded-md bg-black/55 px-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>
      )}

      <EscOverlay
        open={escOpen}
        onResume={() => setEscOpen(false)}
        onQuit={() => void quitToLobby()}
      />

      <FloatingPauseButton onPause={() => setEscOpen(true)} />

      <RewardScreen
        open={rewardOpen}
        earned={rewardCoins}
        onClose={() => setRewardOpen(false)}
      />
    </main>
  );
}

export default function GameShell() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      }
    >
      <GameShellContent />
    </Suspense>
  );
}
