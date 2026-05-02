"use client";

import { Pause } from "lucide-react";

interface FloatingPauseButtonProps {
  onPause: () => void;
}

export function FloatingPauseButton({ onPause }: FloatingPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onPause}
      aria-label="Pause game"
      className="fixed bottom-6 right-4 z-[80] flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-colors hover:bg-black/65"
    >
      <Pause className="size-5 text-white" aria-hidden="true" />
    </button>
  );
}
