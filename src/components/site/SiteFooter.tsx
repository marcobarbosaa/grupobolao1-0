import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="site-footer site-container">
      <Brand />
      <nav aria-label="Explorar a Central do Bolão">
        <Link to="/jogadores">Conheça os jogadores</Link>
        <Link to="/temporadas">Explore as temporadas</Link>
      </nav>
    </footer>
  );
}
