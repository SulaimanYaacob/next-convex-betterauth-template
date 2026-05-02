"use client";

import { CoinBalance } from "@/components/coin-balance";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

interface RewardScreenProps {
  open: boolean;
  earned: number; // coins earned this session (from endSession return value)
  onClose: () => void; // called when Back to Home is clicked
}

export function RewardScreen({ open, earned, onClose }: RewardScreenProps) {
  const updatePresence = useMutation(api.presence.updatePresence);
  const router = useRouter();

  if (!open) return null;

  function handleBackToHome() {
    void updatePresence({ status: "online" }); // fire-and-forget — resets presence
    onClose();
    router.push("/");
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Game over — reward summary"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-32px)] bg-background rounded-2xl border border-border shadow-2xl p-8 flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-200 delay-75">
        {/* Game Over label */}
        <p className="text-sm text-muted-foreground uppercase tracking-wider">Game Over</p>

        {/* Coins earned hero */}
        <div
          className="flex flex-col items-center gap-1"
          aria-label={`Coins earned this session: ${earned}`}
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Coins Earned</p>
          <p className="text-5xl font-semibold tabular-nums leading-none">
            <span className="text-primary">⟟</span>{" "}
            <span className="text-foreground">{earned}</span>
          </p>
          {earned === 0 && (
            <p className="text-sm text-muted-foreground mt-1">No coins this round</p>
          )}
        </div>

        {/* Separator */}
        <div className="w-full border-t border-border" aria-hidden="true" />

        {/* Total balance — live Convex subscription via CoinBalance */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <CoinBalance />
        </div>

        {/* Back to Home CTA */}
        <Button
          variant="default"
          className="w-full min-h-[44px] mt-2"
          onClick={handleBackToHome}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
