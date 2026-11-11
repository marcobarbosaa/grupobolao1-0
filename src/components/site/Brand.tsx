import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import { brand } from "../../lib/brand";

export function Brand({ symbolOnly = false }: { symbolOnly?: boolean }) {
  return (
    <Link to="/" className="site-brand" aria-label={`${brand.name} — início`}>
      <BrandLogo variant={symbolOnly ? "symbol" : "horizontal"} decorative />
    </Link>
  );
}
