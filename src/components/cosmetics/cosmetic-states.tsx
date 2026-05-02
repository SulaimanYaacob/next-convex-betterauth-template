export function CosmeticsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-md border bg-muted"
        />
      ))}
    </div>
  );
}

export function CosmeticsEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ProfileAuthRequired() {
  return (
    <main className="min-h-svh bg-background px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to keep coins, own cosmetics, and tune your identity.
      </p>
    </main>
  );
}
