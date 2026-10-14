import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="site-brand" aria-label="Grupo Bolão — início">
      <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path d="M4 11 22 2l18 9v22L22 42 4 33Z" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 15h10v5h-5v9h5v-5h-3M26 15h6l3 3v4l-3 2 3 2v4l-3 3h-6Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        GRUPO BOLÃO<small>O JOGO PASSA. O LEGADO FICA.</small>
      </span>
    </Link>
  );
}
