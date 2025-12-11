'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Globe, Key, Terminal, Github, Check, Copy, Zap, Code, Server, Sparkles } from 'lucide-react';
import { useState } from 'react';

const FREE_ENDPOINT = 'https://api.openfacilitator.io/free';

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {label || (copied ? 'Copied!' : 'Copy')}
    </button>
  );
}

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
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Docs
            </Link>
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
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - FREE FIRST */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">100% Free • No Account Required</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-foreground">
            Accept <span className="gradient-text">x402 payments</span> in 30 seconds
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Just use our free facilitator endpoint. No signup, no API keys, no setup.
            Copy the URL and start accepting payments.
          </p>
        </div>
      </section>

      {/* The Magic URL */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-background border-2 border-primary shadow-xl shadow-primary/10 p-8">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              FREE ENDPOINT
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Your facilitator URL:</p>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border font-mono text-lg break-all">
                <span className="text-primary flex-1">{FREE_ENDPOINT}</span>
                <CopyButton text={FREE_ENDPOINT} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="font-semibold text-foreground">Base</div>
                <div className="text-muted-foreground">Mainnet</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="font-semibold text-foreground">Solana</div>
                <div className="text-muted-foreground">Mainnet</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="font-semibold text-foreground">USDC</div>
                <div className="text-muted-foreground">Supported</div>
              </div>
            </div>
          </div>

          {/* Quick code example */}
          <div className="mt-8 rounded-xl bg-[#0d1117] border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[#161b22]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27ca40]"></div>
              </div>
              <span className="text-xs text-muted-foreground ml-2">example.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-[#c9d1d9]">
{`import { createPaymentHandler } from '@x402/facilitator';

const handler = createPaymentHandler({
  facilitatorUrl: '${FREE_ENDPOINT}'  // That's it!
});

// Start accepting payments 🎉`}
              </code>
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
            >
              View Documentation
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/rawgroundbeef/openfacilitator"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background hover:bg-secondary transition-colors font-semibold"
            >
              <Github className="w-5 h-5" />
              View Source
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
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-medium">Base + Solana</span>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            <span className="font-medium">Apache 2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-medium">No Rate Limits</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            x402 is an open standard for web payments. The facilitator handles the blockchain stuff.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-2xl bg-background border border-border">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <Code className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Add to your app</h3>
              <p className="text-muted-foreground">
                Point your x402 client at the free endpoint. One line of config.
              </p>
            </div>
            <div className="relative p-6 rounded-2xl bg-background border border-border">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <Sparkles className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">User pays</h3>
              <p className="text-muted-foreground">
                User signs a payment with their wallet. No gas fees for ERC-3009 tokens.
              </p>
            </div>
            <div className="relative p-6 rounded-2xl bg-background border border-border">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Facilitator settles</h3>
              <p className="text-muted-foreground">
                We verify and submit the transaction. Funds go directly to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Want more?</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            The free endpoint works great. But if you want your own branding or to self-host, we&apos;ve got you.
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Hosted */}
            <div className="p-6 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/30 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                You Are Here
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Hosted</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Use our endpoint
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Base + Solana mainnet
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  No account needed
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Unlimited requests
                </li>
              </ul>
              <div className="text-xs text-muted-foreground text-center">
                Just copy the URL above ↑
              </div>
            </div>

            {/* Self-Host */}
            <div className="p-6 rounded-2xl bg-background border border-border">
              <h3 className="text-lg font-semibold mb-2">Self-Host</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Full source code
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Your own infrastructure
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Your own keys
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Docker ready
                </li>
              </ul>
              <Link
                href="https://github.com/rawgroundbeef/openfacilitator"
                className="block w-full py-2.5 rounded-lg border border-border text-center font-medium hover:bg-secondary transition-colors text-sm"
              >
                View on GitHub
              </Link>
            </div>

            {/* Basic */}
            <div className="p-6 rounded-2xl bg-background border border-border">
              <h3 className="text-lg font-semibold mb-2">Basic</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">$5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  your.openfacilitator.io
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Dashboard & analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Manage your keys
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Email support
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-center font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-background border border-border">
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">$25</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Custom domain
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  pay.yourbrand.com
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Auto SSL
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Priority support
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full py-2.5 rounded-lg border border-border text-center font-medium hover:bg-secondary transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints Reference */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">API Reference</h2>
          <p className="text-muted-foreground text-center mb-12">
            Three endpoints. That&apos;s all you need.
          </p>
          
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">GET</span>
                <code className="text-sm font-mono">/free/supported</code>
              </div>
              <p className="text-sm text-muted-foreground">Returns supported networks and tokens</p>
            </div>
            
            <div className="p-5 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">POST</span>
                <code className="text-sm font-mono">/free/verify</code>
              </div>
              <p className="text-sm text-muted-foreground">Verify a payment signature is valid</p>
            </div>
            
            <div className="p-5 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">POST</span>
                <code className="text-sm font-mono">/free/settle</code>
              </div>
              <p className="text-sm text-muted-foreground">Submit the transaction to the blockchain</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Full documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Docs
            </Link>
            <Link href="https://github.com/rawgroundbeef/openfacilitator" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
