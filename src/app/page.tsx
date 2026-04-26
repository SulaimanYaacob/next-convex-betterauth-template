import { GuestBanner } from "@/components/guest-banner";

export default function Home() {
  return (
    <>
      <GuestBanner />
      <main className="min-h-svh flex flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Gami
        </h1>
        <p className="text-sm text-muted-foreground">
          Games and more — coming soon
        </p>
      </main>
    </>
  );
}
