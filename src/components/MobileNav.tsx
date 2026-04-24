import { Trophy, Calendar, Crown, Brain, Zap, Menu, X, BookOpen } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";

const navItems = [
  { title: "Hall da Fama", path: "/", icon: Trophy },
  { title: "Temporadas", path: "/temporadas", icon: Calendar },
  { title: "Recordes", path: "/recordes", icon: Crown },
  { title: "Deep Analytics", path: "/deep-analytics", icon: Brain },
  { title: "Biografias", path: "/biografias", icon: BookOpen },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-neon" />
          <span className="text-sm font-bold tracking-wide">CENTRAL DA LIGA</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 bg-background/95 pt-14 backdrop-blur-xl">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-4 text-base font-medium transition-all ${
                    isActive
                      ? "neon-border bg-neon/10 text-neon"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
