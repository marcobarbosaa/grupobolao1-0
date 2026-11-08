import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="site-footer site-container">
      <Brand />
      <p>
        Uma liga. Muitas histórias.
        <br />
        <span>NBA 2K26 · MyNBA / MyLeague · PC</span>
      </p>
      <span className="footer-edition">
        NBA DOS CRIAS <b>CL</b>
      </span>
    </footer>
  );
}
