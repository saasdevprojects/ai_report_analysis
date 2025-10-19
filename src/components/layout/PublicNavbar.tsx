import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Zap } from "lucide-react";

const navItems = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Zap className="h-5 w-5 text-[#431139]" />
          <span>Solstice</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link to="/sign-in" className="text-sm font-semibold text-foreground hover:text-[#431139]">
            Login
          </Link>
          <Button
            asChild
            className="rounded-full bg-[#431139] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f0b25]"
          >
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-12 flex flex-col gap-4">
                {navItems.map(({ label, to }) => (
                  <Link key={label} to={to} className="text-base text-foreground hover:text-[#431139]">
                    {label}
                  </Link>
                ))}
                <Link to="/sign-in" className="text-base text-foreground hover:text-[#431139]">
                  Login
                </Link>
                <Button asChild className="mt-2 rounded-full bg-[#431139] text-white hover:bg-[#2f0b25]">
                  <Link to="/sign-up">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
