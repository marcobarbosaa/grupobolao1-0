import { brand } from "../../lib/brand";

export function BrandLogo({
  variant = "horizontal",
  decorative = false,
  themed = false,
}: {
  variant?: "horizontal" | "symbol";
  decorative?: boolean;
  themed?: boolean;
}) {
  if (themed)
    return (
      <svg
        className={`brand-logo brand-logo--${variant}`}
        viewBox={variant === "symbol" ? "0 0 64 64" : "0 0 400 64"}
        width={variant === "symbol" ? 64 : 400}
        height={64}
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : brand.name}
      >
        <path fill="var(--team-focus)" d="M14 4H60V46L46 60H4V18Z" />
        <path
          fill="var(--team-background-deep)"
          fillRule="evenodd"
          d="M30 16H20L12 24V40L20 48H30V40H23L20 37V27L23 24H30ZM34 16H46L54 24V29L50 32L54 36V40L46 48H34ZM42 24V29H45L47 27V26L45 24ZM42 36V40H45L47 38V37L45 36Z"
        />
        {variant === "horizontal" && (
          <text
            x="80"
            y="45"
            fill="var(--team-text)"
            fontFamily="var(--font-display)"
            fontSize="41"
            fontWeight="800"
          >
            {brand.name.toUpperCase()}
          </text>
        )}
      </svg>
    );
  return (
    <img
      className={`brand-logo brand-logo--${variant}`}
      src={variant === "symbol" ? brand.symbol : brand.logo}
      width={variant === "symbol" ? 64 : 400}
      height={64}
      alt={decorative ? "" : brand.name}
      decoding="async"
    />
  );
}
