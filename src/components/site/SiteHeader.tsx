import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Brand } from "./Brand";
import { MainNavigation } from "./MainNavigation";
import { MobileMenu } from "./MobileMenu";

export function SiteHeader() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);
  return (
    <header className="site-header" data-integrated={(pathname === "/" || /^\/jogadores\/?$/.test(pathname)) && !scrolled}>
      <div className="site-header-inner">
        <Brand symbolOnly={pathname === "/" || /^\/jogadores\/?$/.test(pathname)} />
        <MainNavigation />
        <MobileMenu />
      </div>
    </header>
  );
}
