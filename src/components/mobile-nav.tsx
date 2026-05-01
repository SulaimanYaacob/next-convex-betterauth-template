"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { GamiLogo } from "@/components/gami-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function MobileNav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
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
    <>
      {/* Mobile top bar */}
      <nav
        aria-label="Primary"
        className="flex md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14"
      >
        <div className="w-full px-4 flex items-center justify-between">
          <Link href="/" aria-label="Gami home">
            <GamiLogo size="sm" />
          </Link>

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
      </nav>

      {/* Mobile search row — full-width, below top bar */}
      <div
        aria-label="Search row"
        className="flex md:hidden fixed top-14 left-0 right-0 z-40 bg-background border-b border-border px-4 py-2"
      >
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search games..."
            aria-label="Search games"
            className="w-full pl-9"
          />
        </div>
      </div>
    </>
  );
}
