interface GamiLogoProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { mark: 24, wordmark: "text-xl" },
  md: { mark: 32, wordmark: "text-3xl" },
  lg: { mark: 40, wordmark: "text-4xl" },
} as const;

export function GamiLogo({ size = "md" }: GamiLogoProps) {
  const { mark, wordmark } = sizeMap[size];
  const sq = mark * 0.625; // inner square edge — 20px at md

  return (
    <div className="flex items-center gap-2">
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 32 32"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6" y="6" width={sq} height={sq} rx="4"
          fill="var(--primary)"
          fillOpacity="0.4"
        />
        <rect
          x="12" y="12" width={sq} height={sq} rx="4"
          fill="var(--primary)"
        />
      </svg>
      <span
        className={`${wordmark} font-semibold text-foreground leading-none`}
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        gami
      </span>
    </div>
  );
}
