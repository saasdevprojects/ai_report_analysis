import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const year = new Date().getFullYear();

export default function PublicFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-5">
        <div>
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Zap className="h-5 w-5 text-primary" />
            <span>Product Summary</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered product analysis & market research.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Product</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/features" className="text-muted-foreground hover:text-foreground">
                Features
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Privacy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Stay in the loop</h4>
          <p className="text-sm text-muted-foreground mb-3">Occasional updates about new features.</p>
          <div className="flex gap-2">
            <Input type="email" placeholder="you@example.com" className="bg-background" />
            <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {year} Product Summary. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground">
              LinkedIn
            </a>
            <a href="#" className="hover:text-foreground">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
