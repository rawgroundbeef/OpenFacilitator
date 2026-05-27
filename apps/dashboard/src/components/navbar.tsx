'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/user-menu';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDocsPage = pathname?.startsWith('/docs');
  const isHomePage = pathname === '/';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" onClick={closeMobileMenu}>
            <img src="/icon.svg" alt="" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">OpenFacilitator</span>
          </Link>

          {/* Desktop nav - hidden on mobile */}
          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/docs"
              className={`text-sm font-semibold transition-colors ${
                isDocsPage
                  ? 'text-foreground'
                  : 'text-foreground/75 hover:text-foreground'
              }`}
              title="Documentation"
            >
              Docs
            </Link>
            {isHomePage && (
              <a
                href="#stats"
                className="text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground"
              >
                Stats
              </a>
            )}
            <a
              href="https://github.com/rawgroundbeef/openfacilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground"
              title="GitHub"
            >
              GitHub
            </a>
            <ThemeToggle />

            {/* Auth-aware section */}
            {!isLoading && isAuthenticated ? (
              <div className="flex items-center gap-1">
                <NotificationBell />
                <UserMenu />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="-mr-2 p-2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

      {/* Mobile menu - slides down when open */}
      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            <Link
              href="/docs"
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                isDocsPage
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={closeMobileMenu}
            >
              <FileText className="h-5 w-5" />
              Docs
            </Link>
            {isHomePage && (
              <a
                href="#stats"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={closeMobileMenu}
              >
                <Activity className="h-5 w-5" />
                Stats
              </a>
            )}
            <a
              href="https://github.com/rawgroundbeef/openfacilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={closeMobileMenu}
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>

            <div className="border-t border-border/50 pt-2">
              {!isLoading && isAuthenticated ? (
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <UserMenu />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
