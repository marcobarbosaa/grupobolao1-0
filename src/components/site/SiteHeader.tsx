import { Brand } from "./Brand";
import { MainNavigation } from "./MainNavigation";
import { MobileMenu } from "./MobileMenu";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <MainNavigation />
        <MobileMenu />
      </div>
    </header>
  );
}
