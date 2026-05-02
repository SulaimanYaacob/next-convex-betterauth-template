import { cn } from "@/lib/utils";

export function GameStartOverlay({
  title,
  description,
  buttonLabel,
  accentClassName,
  onStart,
  chips,
  disabled,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  accentClassName: string;
  onStart: () => void;
  chips?: string[];
  disabled?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/40 p-5">
      <section className="w-[min(460px,100%)] rounded-md border border-white/15 bg-[#101012]/95 p-6 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/65">
          {description}
        </p>
        {chips && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-white/60">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 px-3 py-1"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className={cn(
            "mt-5 min-h-12 w-full rounded-md font-semibold text-[#171207] disabled:cursor-not-allowed disabled:opacity-65",
            accentClassName,
          )}
        >
          {buttonLabel}
        </button>
      </section>
    </div>
  );
}
