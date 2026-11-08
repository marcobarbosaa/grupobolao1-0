import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { isNavigationActive, siteNavigation } from "../../lib/site-navigation";

export function MainNavigation({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  return (
    <nav
      className={mobile ? "mobile-navigation" : "desktop-navigation"}
      aria-label={mobile ? "Navegação mobile" : "Navegação principal"}
    >
      {siteNavigation.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={isNavigationActive(pathname, item.to) ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.label}
          {mobile && <ArrowUpRight aria-hidden="true" />}
        </Link>
      ))}
    </nav>
  );
}
