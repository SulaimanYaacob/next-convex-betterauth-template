"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { GamiLogo } from "@/components/gami-logo";
import { CoinBalance } from "@/components/coin-balance";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function AppNav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)
      ?.isAnonymous === true;
  const isAuthenticated = session?.user !== undefined && !isAnonymous;

  const email = session?.user?.email ?? "";
  const initials = (email.split("@")[0] || "U").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const result = await authClient.signOut();
    if (result?.error) {
      toast.error("Sign out failed. Try again.");
      return;
    }
    router.push("/sign-in");
  }

  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16"
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center gap-4">
        {/* Left: logo */}
        <Link href="/" aria-label="Gami home" className="shrink-0">
          <GamiLogo size="md" />
        </Link>

        {/* Center: search (visual-only per D-06) */}
        <div className="flex-1 max-w-xl relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search games..."
            aria-label="Search games"
            className="pl-9"
          />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/store"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            Store
          </Link>

          {isAuthenticated && <CoinBalance />}

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open profile menu"
              className="size-[44px] inline-flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
                className="text-destructive focus:text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
