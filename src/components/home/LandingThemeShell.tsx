import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation } from "@tanstack/react-router";
import { newRoster } from "../../lib/new-roster";
import { getLandingTheme, INITIAL_PROTAGONIST_ID } from "../../lib/landing-team-themes";
import "./LandingTheme.css";
import { getSelectionTheme, selectionRoster } from "../../lib/player-selection-identity";

const LandingThemeContext = createContext<{
  playerIndex: number;
  setPlayerIndex: Dispatch<SetStateAction<number>>;
  firstPlayer: number;
  portalContainer: HTMLDivElement | null;
} | null>(null);
export const useLandingTheme = () => useContext(LandingThemeContext);

function LandingShell({ children, selection }: { children: ReactNode; selection: boolean }) {
  const firstPlayer = Math.max(
    newRoster.findIndex((player) => player.id === INITIAL_PROTAGONIST_ID),
    0,
  );
  const [playerIndex, setPlayerIndex] = useState(firstPlayer);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const player = (selection ? selectionRoster : newRoster)[playerIndex];
  return (
    <LandingThemeContext.Provider
      value={{ playerIndex, setPlayerIndex, firstPlayer, portalContainer }}
    >
      <div
        ref={setPortalContainer}
        className="site-shell"
        data-landing-team={player.team}
        style={
          (selection
            ? getSelectionTheme(playerIndex)
            : getLandingTheme(player.team)) as CSSProperties
        }
      >
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}
/** The owner unmounts on navigation: no CSS variables or carousel state leak to other routes. */
export function SiteShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return pathname === "/" || /^\/jogadores\/?$/.test(pathname) ? (
    <LandingShell selection={pathname !== "/"}>{children}</LandingShell>
  ) : (
    <div className="site-shell">{children}</div>
  );
}
