import { Link } from "wouter";
import { Zap } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartReserve</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/offers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse Offers
            </Link>
            <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-brand flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">SmartReserve</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Intelligent demand-aware booking marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}
