"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const DISMISS_KEY = "gami_banner_dismissed";

export function GuestBanner() {
  const { data: session } = authClient.useSession();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Read dismissal flag only after hydration to avoid SSR/CSR mismatch
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem(DISMISS_KEY) === "true") {
        setDismissed(true);
      }
    }
    setHydrated(true);
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setDismissed(true);
  }

  // Avoid SSR mismatch — render nothing until we know dismissal state
  if (!hydrated) return null;

  // Read isAnonymous via inferAdditionalFields plugin in auth-client.ts.
  // Cast through unknown because the inferred session type carries
  // additional fields including isAnonymous.
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;

  if (!isAnonymous || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Guest account notice"
      className="w-full sticky top-0 z-40 border-b"
      style={{
        backgroundColor: "#f1f5fb",
        borderColor: "rgba(59,130,246,0.15)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 flex items-center justify-between gap-2 min-h-[44px]">
        <p className="text-xs text-muted-foreground">
          Create an account to save your progress
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-up"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center min-h-[44px] px-2"
          >
            Create account
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="size-[44px] inline-flex items-center justify-center rounded-md hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
