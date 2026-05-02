"use client";

import { useEffect } from "react";
import {
  isPlatformPauseMessage,
  isPlatformResumeMessage,
} from "@/lib/game-messages";

export function usePlatformPause(
  onPause: () => void,
  onResume: () => void,
) {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (isPlatformPauseMessage(event)) onPause();
      if (isPlatformResumeMessage(event)) onResume();
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPause, onResume]);
}
