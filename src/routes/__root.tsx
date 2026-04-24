import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AppSidebar } from "../components/AppSidebar";
import { MobileNav } from "../components/MobileNav";

import appCss from "../styles.css?url";

const interFont =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold neon-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que procuras não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-neon px-6 py-2.5 text-sm font-semibold text-neon-foreground transition-all hover:opacity-90 neon-glow"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Central da Liga — NBA 2K Dashboard" },
      {
        name: "description",
        content: "Dashboard premium de análise desportiva para a liga NBA 2K",
      },
      { property: "og:title", content: "Central da Liga — NBA 2K Dashboard" },
      {
        property: "og:description",
        content: "Dashboard premium de análise desportiva para a liga NBA 2K",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: interFont },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileNav />
      <main className="lg:ml-64">
        <div className="min-h-screen pt-14 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
