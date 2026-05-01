"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const HEARTBEAT_INTERVAL_MS = 15 * 1000;
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

export function HeartbeatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)
      ?.isAnonymous === true;
  const isAuthenticated = session?.user !== undefined && !isAnonymous;

  const updatePresence = useMutation(api.presence.updatePresence);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<"online" | "idle">("online");

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial heartbeat on mount
    void updatePresence({ status: "online" });

    // 15s heartbeat — sends current status (online or idle)
    const interval = setInterval(() => {
      void updatePresence({ status: statusRef.current });
    }, HEARTBEAT_INTERVAL_MS);

    // Idle detection (3 minutes of no activity → "idle")
    function resetIdle() {
      if (statusRef.current === "idle") {
        statusRef.current = "online";
        void updatePresence({ status: "online" });
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        statusRef.current = "idle";
        void updatePresence({ status: "idle" });
      }, IDLE_TIMEOUT_MS);
    }

    resetIdle(); // start the timer

    const events = ["mousemove", "keydown", "scroll", "click"] as const;
    events.forEach((e) =>
      window.addEventListener(e, resetIdle, { passive: true }),
    );

    return () => {
      clearInterval(interval);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [isAuthenticated, updatePresence]);

  return <>{children}</>;
}
