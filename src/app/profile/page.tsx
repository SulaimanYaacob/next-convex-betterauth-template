"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CosmeticCard } from "@/components/cosmetics/cosmetic-card";
import { EquippedSlotCard } from "@/components/cosmetics/equipped-slot-card";
import {
  CosmeticsEmptyState,
  ProfileAuthRequired,
} from "@/components/cosmetics/cosmetic-states";
import {
  CosmeticInventoryItem,
  EquippedCosmeticSlugs,
  readableCosmeticError,
} from "@/lib/cosmetic-inventory";
import {
  EQUIP_SLOT_LABELS,
  EQUIP_SLOT_ORDER,
  EquipSlot,
} from "@/lib/cosmetics";

export default function ProfilePage() {
  const profile = useQuery(api.profile.getViewer);
  const inventory = useQuery(api.store.getViewerInventory);
  const updateUsername = useMutation(api.profile.updateUsername);
  const equip = useMutation(api.store.equip);
  const unequip = useMutation(api.store.unequip);

  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setUsername(profile.username || profile.displayName);
  }, [profile]);

  const items = (inventory?.items ?? []) as CosmeticInventoryItem[];
  const equipped = (inventory?.equipped ?? {}) as EquippedCosmeticSlugs;
  const ownedItems = items.filter((item) => item.owned);

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateUsername({ username });
      toast.success("Username saved.");
    } catch (error) {
      toast.error(readableCosmeticError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleEquip(item: CosmeticInventoryItem) {
    setBusy(true);
    try {
      await equip({ itemId: item._id });
      toast.success(`${item.name} equipped.`);
    } catch (error) {
      toast.error(readableCosmeticError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleUnequip(slot: EquipSlot) {
    setBusy(true);
    try {
      await unequip({ slot });
      toast.success(`${EQUIP_SLOT_LABELS[slot]} cleared.`);
    } catch (error) {
      toast.error(readableCosmeticError(error));
    } finally {
      setBusy(false);
    }
  }

  if (profile === undefined || inventory === undefined) {
    return (
      <main className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto h-[520px] w-full max-w-6xl animate-pulse rounded-md bg-muted" />
      </main>
    );
  }

  if (!profile || !inventory.authenticated) {
    return <ProfileAuthRequired />;
  }

  return (
    <main className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="space-y-4 rounded-md border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="size-14">
              <AvatarFallback className="text-base font-semibold">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                {profile.displayName}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Coin balance</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {profile.balance.toLocaleString()} coins
            </p>
          </div>

          <form className="space-y-2" onSubmit={handleNameSubmit}>
            <label className="text-sm font-medium" htmlFor="username">
              Username
            </label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={2}
                maxLength={18}
              />
              <Button type="submit" size="icon" disabled={busy}>
                <Save className="size-4" />
                <span className="sr-only">Save username</span>
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Equipped</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {EQUIP_SLOT_ORDER.map((slot) => {
                const item = items.find(
                  (candidate) => candidate.slug === equipped[slot],
                );
                return (
                  <EquippedSlotCard
                    key={slot}
                    slot={slot}
                    item={item}
                    busy={busy}
                    onUnequip={(nextSlot) => void handleUnequip(nextSlot)}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Owned</h2>
                <p className="text-sm text-muted-foreground">
                  Equip from here or the store. Changes apply instantly.
                </p>
              </div>
              <Badge variant="outline">{ownedItems.length} owned</Badge>
            </div>

            {ownedItems.length === 0 ? (
              <div className="mt-3">
                <CosmeticsEmptyState>
                  Buy your first common cosmetic after a few good sessions.
                </CosmeticsEmptyState>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ownedItems.map((item) => (
                  <CosmeticCard
                    key={item._id}
                    item={item}
                    action={
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        variant={item.equipped ? "secondary" : "default"}
                        disabled={item.equipped || busy}
                        onClick={() => void handleEquip(item)}
                      >
                        {item.equipped ? (
                          <Check className="size-4" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        {item.equipped ? "Equipped" : "Equip"}
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
