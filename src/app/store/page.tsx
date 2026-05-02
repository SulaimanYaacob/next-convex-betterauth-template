"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CosmeticCard } from "@/components/cosmetics/cosmetic-card";
import { CosmeticDetailPanel } from "@/components/cosmetics/cosmetic-detail-panel";
import { CosmeticFilterTabs } from "@/components/cosmetics/cosmetic-filter-tabs";
import {
  CosmeticsEmptyState,
  CosmeticsGridSkeleton,
} from "@/components/cosmetics/cosmetic-states";
import {
  CosmeticInventoryItem,
  readableCosmeticError,
} from "@/lib/cosmetic-inventory";
import { CosmeticType } from "@/lib/cosmetics";

export default function StorePage() {
  const inventory = useQuery(api.store.getViewerInventory);
  const purchase = useMutation(api.store.purchase);
  const equip = useMutation(api.store.equip);

  const [filter, setFilter] = useState<"all" | CosmeticType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] =
    useState<CosmeticInventoryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = (inventory?.items ?? []) as CosmeticInventoryItem[];
  const visibleItems =
    filter === "all" ? items : items.filter((item) => item.type === filter);
  const selectedItem =
    items.find((item) => item._id === selectedId) ?? visibleItems[0] ?? null;

  async function handlePurchase(item: CosmeticInventoryItem) {
    setBusyId(item._id);
    try {
      const result = await purchase({ itemId: item._id });
      toast[result?.status === "owned" ? "info" : "success"](
        result?.status === "owned"
          ? "Already owned."
          : "Purchased. Equip it when ready.",
      );
    } catch (error) {
      toast.error(readableCosmeticError(error));
    } finally {
      setBusyId(null);
      setConfirmItem(null);
    }
  }

  async function handleEquip(item: CosmeticInventoryItem) {
    setBusyId(item._id);
    try {
      await equip({ itemId: item._id });
      toast.success(`${item.name} equipped.`);
    } catch (error) {
      toast.error(readableCosmeticError(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Store</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Buy clean cosmetics with earned coins. Common items are tuned for
                a few good sessions.
              </p>
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {inventory?.balance === undefined || inventory?.balance === null
                ? "Coins"
                : `${inventory.balance.toLocaleString()} coins`}
            </div>
          </div>

          <CosmeticFilterTabs value={filter} onChange={setFilter} />

          {inventory === undefined ? (
            <CosmeticsGridSkeleton />
          ) : visibleItems.length === 0 ? (
            <CosmeticsEmptyState>
              No cosmetics in this filter yet.
            </CosmeticsEmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <CosmeticCard
                  key={item._id}
                  item={item}
                  selected={selectedItem?._id === item._id}
                  onSelect={(nextItem) => setSelectedId(nextItem._id)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <CosmeticDetailPanel
              item={selectedItem}
              authenticated={inventory?.authenticated}
              busy={Boolean(selectedItem && busyId === selectedItem._id)}
              onBuy={setConfirmItem}
              onEquip={(item) => void handleEquip(item)}
            />
          </div>
        </aside>
      </div>

      <AlertDialog
        open={confirmItem !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buy {confirmItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This spends {confirmItem?.price.toLocaleString()} earned coins.
              The item appears in your profile immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (confirmItem) void handlePurchase(confirmItem);
              }}
            >
              Buy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
