import { Trophy, Calendar, Crown, Brain, Zap, BookOpen } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

const navItems = [
  { title: "Hall da Fama", path: "/", icon: Trophy },
  { title: "Temporadas", path: "/temporadas", icon: Calendar },
  { title: "Recordes", path: "/recordes", icon: Crown },
  { title: "Deep Analytics", path: "/deep-analytics", icon: Brain },
  { title: "Biografias", path: "/biografias", icon: BookOpen },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg neon-border">
          <Zap className="h-5 w-5 text-neon" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-foreground">CENTRAL DA LIGA</h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            NBA 2K League
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "neon-border bg-neon/10 text-neon"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Versão Beta
          </p>
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
