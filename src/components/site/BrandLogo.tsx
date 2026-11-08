import { brand } from "../../lib/brand";

export function BrandLogo({
  variant = "horizontal",
  decorative = false,
}: {
  variant?: "horizontal" | "symbol";
  decorative?: boolean;
}) {
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
