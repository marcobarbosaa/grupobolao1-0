import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="site-brand" aria-label="Central da Liga — início">
      <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path d="M4 11 22 2l18 9v22L22 42 4 33Z" stroke="currentColor" strokeWidth="2" />
        <path
          d="M21 14h-8v16h8M27 14v16h8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        CENTRAL DA LIGA<small>NBA DOS CRIAS / SPORTS GAMING</small>
      </span>
    </Link>
  );
}
