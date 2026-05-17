'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github, FileText } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/user-menu';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDocsPage = pathname?.startsWith('/docs');

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="fixed w-full z-50 border-b border-border/50 backdrop-blur-xl bg-background/80 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={closeMobileMenu}>
          <img src="/icon.svg" alt="" className="w-9 h-9" />
          <span className="font-bold text-xl tracking-tight">OpenFacilitator</span>
        </Link>

        {/* Desktop nav - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/docs"
            className={`p-2 rounded-lg transition-colors ${
              isDocsPage
                ? 'text-gray-900 dark:text-gray-100 bg-muted'
                : 'text-gray-600 hover:text-gray-900 hover:bg-muted/50 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
            title="Documentation"
          >
            <FileText className="w-5 h-5" />
          </Link>
          <a
            href="https://github.com/rawgroundbeef/openfacilitator"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-muted/50 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>

          {/* Auth-aware section */}
          {isLoading ? (
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <UserMenu />
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger - visible on mobile only */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu - slides down when open */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link
              href="/docs"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                isDocsPage
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-muted dark:text-gray-400 dark:hover:text-gray-100'
              }`}
              onClick={closeMobileMenu}
            >
              <FileText className="w-5 h-5" />
              Docs
            </Link>
            <a
              href="https://github.com/rawgroundbeef/openfacilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-muted dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              onClick={closeMobileMenu}
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>

            <div className="pt-2 border-t border-border/50">
              {isLoading ? (
                <div className="px-3 py-3">
                  <div className="w-full h-10 bg-muted rounded animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <UserMenu />
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="block px-3 py-3 rounded-lg text-sm text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
