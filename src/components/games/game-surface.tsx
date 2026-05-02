import { cn } from "@/lib/utils";

export function GameSurface({
  children,
  className,
  grid = false,
}: {
  children: React.ReactNode;
  className?: string;
  grid?: boolean;
}) {
  return (
    <main
      className={cn(
        "fixed inset-0 overflow-hidden bg-[#101012] text-[#f8f6f2]",
        className,
      )}
    >
      {grid && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(248,246,242,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(248,246,242,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
      )}
      {children}
    </main>
  );
}
