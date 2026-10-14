export const siteNavigation = [
  { label: "Início", to: "/" },
  { label: "Jogadores", to: "/biografias" },
  { label: "Temporadas", to: "/temporadas" },
  { label: "Hall da Fama", to: "/hall-da-fama" },
  { label: "Recordes", to: "/recordes" },
  { label: "Comparar", to: "/deep-analytics" },
] as const;

export function isNavigationActive(pathname: string, to: string) {
  return pathname === to || (to === "/biografias" && pathname.startsWith("/jogadores/"));
}
