import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import { useLandingTheme } from "../home/LandingThemeShell";
import { MainNavigation } from "./MainNavigation";

export function MobileMenu() {
  const landing = useLandingTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="mobile-menu-trigger" aria-label="Abrir menu de navegação">
        <Menu size={24} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal container={landing?.portalContainer ?? undefined}>
        <Dialog.Overlay className="mobile-menu-overlay" />
        <Dialog.Content className="mobile-menu">
          <div className="mobile-menu-top">
            <BrandLogo themed={Boolean(landing)} />
            <Dialog.Close className="icon-button" aria-label="Fechar menu">
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Navegação da Central do Bolão</Dialog.Title>
          <Dialog.Description className="sr-only">
            Escolha uma seção para explorar jogadores, temporadas e estatísticas.
          </Dialog.Description>
          <MainNavigation mobile onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
