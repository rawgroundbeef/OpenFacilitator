import Link from 'next/link';
import { ArrowRight, ShieldCheck, Globe, Key, Terminal, Github, Check, Lock, Unlock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-grid">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">OpenFacilitator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/rawgroundbeef/openfacilitator" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
            <Link
              href="/auth/signin"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-foreground mb-8">
            <Unlock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Open Source x402 Infrastructure</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-foreground">
            Deploy your{' '}
            <span className="gradient-text">x402 facilitator</span>
            {' '}in minutes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The open source platform for running payment facilitators. Self-host for free
            or get a managed subdomain instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all glow-primary"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/rawgroundbeef/openfacilitator"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background hover:bg-secondary transition-colors font-semibold"
            >
              <Terminal className="w-5 h-5" />
              Self-Host
            </Link>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-12 px-6 border-y border-border bg-secondary/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-medium">Non-Custodial</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-medium">Your Keys, Your Control</span>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            <span className="font-medium">Apache 2.0 License</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-medium">Multi-Chain Support</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need to accept x402 payments
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Built for transparency, security, and ease of use.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Setup</h3>
              <p className="text-muted-foreground">
                Get your facilitator running in under a minute. No Docker, no DevOps, no hassle.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Domains</h3>
              <p className="text-muted-foreground">
                Use your own domain with automatic SSL. CNAME and you&apos;re done.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Keys, Your Control</h3>
              <p className="text-muted-foreground">
                Encrypted key storage or bring your own. Never trust, always verify.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Start free with self-hosting. Upgrade for managed infrastructure and custom domains.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-background border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Self-host anywhere
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Full source code access
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Docker Compose ready
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Community support
                </li>
              </ul>
              <Link
                href="https://github.com/rawgroundbeef/openfacilitator"
                className="block w-full py-3 rounded-lg border border-border text-center font-medium hover:bg-secondary transition-colors"
              >
                View on GitHub
              </Link>
            </div>

            {/* Starter */}
            <div className="p-8 rounded-2xl bg-background border-2 border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                Popular
              </div>
              <h3 className="text-lg font-semibold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  yourname.openfacilitator.io
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Managed infrastructure
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Dashboard analytics
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Email support
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full py-3 rounded-lg bg-primary text-primary-foreground text-center font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl bg-background border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Custom domain support
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Auto SSL via Let&apos;s Encrypt
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  Priority support
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  SLA guarantee
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full py-3 rounded-lg border border-border text-center font-medium hover:bg-secondary transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to accept x402 payments?</h2>
          <p className="text-muted-foreground mb-8">
            Join the open network of payment facilitators. Start in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all glow-primary"
          >
            Launch Your Facilitator
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">OpenFacilitator</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open source under Apache 2.0 license
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/rawgroundbeef/openfacilitator" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
