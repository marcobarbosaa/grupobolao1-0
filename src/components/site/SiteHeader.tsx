import { Link, useLocation } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { isNavigationActive, siteNavigation } from "../../lib/site-navigation";
import { Brand } from "./Brand";

export function SiteHeader() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <header className={`site-header ${scrolled || pathname !== "/" ? "is-solid" : ""}`}>
      <div className="site-header-inner">
        <Brand />
        <nav className="desktop-navigation" aria-label="Navegação principal">
          {siteNavigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isNavigationActive(pathname, item.to) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="header-edition">
          NBA 2K26 <span>/</span> PC
        </span>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="mobile-menu-trigger" aria-label="Abrir menu de navegação">
            <Menu size={23} aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="mobile-menu-overlay" />
            <Dialog.Content className="mobile-menu">
              <div className="mobile-menu-top">
                <Dialog.Title className="eyebrow">Grupo Bolão / Navegação</Dialog.Title>
                <Dialog.Close className="icon-button" aria-label="Fechar menu">
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Explore os jogadores e a história da liga.
              </Dialog.Description>
              <nav aria-label="Navegação mobile">
                {siteNavigation.map((item, index) => (
                  <Dialog.Close asChild key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={isNavigationActive(pathname, item.to) ? "page" : undefined}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <span className="menu-number">0{index + 1}</span>
                      {item.label}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Dialog.Close>
                ))}
              </nav>
              <p className="mobile-menu-signoff">
                A liga é nossa.
                <br />A história também.
              </p>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
