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
      className="md:hidden fixed bottom-6 right-4 z-40 flex items-center justify-center size-11 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
    >
      <Pause className="size-5 text-white" aria-hidden="true" />
    </button>
  );
}
