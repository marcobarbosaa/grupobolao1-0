export const siteNavigation = [
  { label: "Hall da Fama", to: "/" },
  { label: "Temporadas", to: "/temporadas" },
  { label: "Recordes", to: "/recordes" },
  { label: "Comparar", to: "/deep-analytics" },
  { label: "Biografias", to: "/biografias" },
] as const;

export function isNavigationActive(pathname: string, to: string) {
  return (
    pathname === to ||
    (to === "/" && pathname === "/hall-da-fama") ||
    (to === "/biografias" && /^\/jogadores(?:\/|$)/.test(pathname))
  );
}
