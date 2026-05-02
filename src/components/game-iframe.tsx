"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface GameIframeProps {
  iframeUrl: string;
  gameName: string;
  userId: string | undefined;
  sessionId: string | null;
  onLoad: () => void;
  onEscape?: () => void;
  paused?: boolean;
}

export function GameIframe({
  iframeUrl,
  gameName,
  userId,
  sessionId,
  onLoad,
  onEscape,
  paused = false,
}: GameIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const sessionInitSentRef = useRef(false);

  function handleLoad() {
    setIframeLoaded(true);
    onLoad();

    // Send SESSION_INIT once after iframe loads — guard prevents duplicate sends on remount
    if (!sessionInitSentRef.current && iframeRef.current?.contentWindow) {
      try {
        const targetOrigin = new URL(iframeUrl, window.location.origin).origin;
        iframeRef.current.contentWindow.postMessage(
          { type: "SESSION_INIT", userId: userId ?? "guest", sessionId: sessionId ?? "" },
          targetOrigin,
        );
        sessionInitSentRef.current = true;
      } catch {
        // Malformed iframeUrl (e.g. placeholder) — skip SESSION_INIT silently in dev
        // In production, real URLs will parse correctly
        sessionInitSentRef.current = true;
      }
    }
  }

  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current?.contentWindow) return;
    const targetOrigin = new URL(iframeUrl, window.location.origin).origin;
    iframeRef.current.contentWindow.postMessage(
      { type: paused ? "PLATFORM_PAUSE" : "PLATFORM_RESUME" },
      targetOrigin,
    );
  }, [iframeLoaded, iframeUrl, paused]);

  useEffect(() => {
    if (!iframeLoaded || !onEscape) return;
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;

    function handleIframeKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
      }
    }

    try {
      targetWindow.addEventListener("keydown", handleIframeKeyDown);
      return () => {
        targetWindow.removeEventListener("keydown", handleIframeKeyDown);
      };
    } catch {
      return undefined;
    }
  }, [iframeLoaded, onEscape]);

  return (
    <div className="absolute inset-0">
      {/* Loading skeleton — visible until iframe fires onLoad */}
      {!iframeLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <span className="sr-only">Loading game...</span>
          <Loader2 className="size-8 text-muted-foreground animate-spin" aria-hidden="true" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen"
        className="absolute inset-0 w-full h-full border-0"
        title={gameName}
        onLoad={handleLoad}
      />
    </div>
  );
}
