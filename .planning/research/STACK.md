# Stack Research: Token Rewards Program

**Project:** OpenFacilitator Token Rewards
**Researched:** 2026-01-19
**Overall Confidence:** HIGH

## Executive Summary

Building a token rewards program on Solana with the existing OpenFacilitator stack is well-supported by mature libraries. The project already uses `@solana/web3.js@1.98.4` and `@solana/spl-token@0.4.14`, which are the correct choices for production. Signature verification should use `@noble/ed25519` (not tweetnacl) for security reasons. Volume aggregation uses native SQLite with better-sqlite3, no additional libraries needed.

---

## Recommended Stack

### Signature Verification

**Library:** `@noble/ed25519` ^3.0.0
**Confidence:** HIGH
**Rationale:**
- Provides SUF-CMA (strong unforgeability under chosen message attacks) security guarantees
- Fixes signature malleability vulnerabilities present in tweetnacl
- 3-5x faster than tweetnacl in benchmarks
- Zero dependencies, 5KB bundle size
- Audited by cure53 (v1), cross-tested against noble-curves (v3)

**Alternative:** `tweetnacl@1.0.3`
**Why Not:** Has known signature malleability issues problematic in blockchain contexts. The Solana team has investigated replacement. Use only if React Native compatibility is required.

**Installation:**
```bash
pnpm add @noble/ed25519@^3.0.0
```

**Usage Pattern:**
```typescript
import { verify } from '@noble/ed25519';
import bs58 from 'bs58';

async function verifyOwnership(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  return verify(signature, message, publicKey);
}
```

---

### Sign In With Solana (SIWS) - Optional

**Library:** `@web3auth/sign-in-with-solana` ^5.0.0
**Confidence:** MEDIUM
**Rationale:**
- Standardized message format based on EIP-4361 (SIWE)
- Provides message construction and verification utilities
- Good for consistent UX if building wallet-connect flows

**Alternative:** Direct signature verification with `@noble/ed25519`
**When to use direct verification:** For simple "prove you own this address" flows without full session management, direct verification is simpler and has fewer dependencies.

**Why MEDIUM confidence:** Only 5 projects use this in npm registry. For basic ownership proof, direct ed25519 verification is sufficient and more widely tested.

---

### Solana Core (KEEP EXISTING)

**Library:** `@solana/web3.js` ^1.98.4
**Confidence:** HIGH
**Rationale:**
- Already in use in the project
- Production-stable, 4,911+ dependents
- v2.0 exists but ecosystem adoption is still maturing
- Most dependencies (including @solana/spl-token) still target v1.x

**Do NOT upgrade to 2.0 yet because:**
- Breaking API changes require significant refactoring
- @solana/spl-token 0.4.x is designed for web3.js 1.x
- Anchor and many ecosystem tools don't support v2 yet
- December 2024 supply chain attack on 1.95.5/1.95.6 was patched; current 1.98.4 is safe

**Migration path:** When ready to upgrade, use `@solana/kit` (the new name for web3.js 2.x) and `@solana-program/token` for Token Program interactions.

---

### SPL Token Transfers (KEEP EXISTING)

**Library:** `@solana/spl-token` ^0.4.14
**Confidence:** HIGH
**Rationale:**
- Already in use in the project
- Stable, well-documented
- Supports both Token Program and Token-2022

**Key functions for rewards distribution:**
```typescript
import {
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
```

**Best Practices:**
1. Use `createTransferCheckedInstruction` (not `createTransferInstruction`) - validates decimals
2. Use `getOrCreateAssociatedTokenAccount` to handle recipient ATA creation
3. Check if source != destination before transfer (same-account transfers always succeed but do nothing)
4. Include priority fees for reliable execution during congestion

---

### Database (KEEP EXISTING)

**Library:** `better-sqlite3` ^11.6.0
**Confidence:** HIGH
**Rationale:**
- Already in use in the project
- Synchronous API is simpler for volume aggregation queries
- Native SQLite aggregation functions (SUM, COUNT, AVG) are performant
- No need for additional ORM - raw SQL with prepared statements is sufficient

**Volume Aggregation Pattern:**
```typescript
// Example: Aggregate volume by user and period
const stmt = db.prepare(`
  SELECT
    user_id,
    SUM(amount_usd) as total_volume,
    COUNT(*) as transaction_count
  FROM transactions
  WHERE created_at >= ? AND created_at < ?
  GROUP BY user_id
  HAVING SUM(amount_usd) >= ?
`);

const qualifiedUsers = stmt.all(periodStart, periodEnd, minThreshold);
```

**Alternative:** Drizzle ORM
**Why not recommended:** Adds complexity without significant benefit for this use case. better-sqlite3 with raw SQL is more performant for aggregation queries and the team already has it working.

---

### Nonce Management (for replay protection)

**Library:** No additional library needed
**Confidence:** HIGH
**Rationale:**
- Store nonces in SQLite database
- Generate with `crypto.randomUUID()` or `nanoid` (already in project)
- Mark as used after successful verification

**Schema addition:**
```sql
CREATE TABLE signature_nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_nonces_wallet ON signature_nonces(wallet_address);
CREATE INDEX idx_nonces_expires ON signature_nonces(expires_at);
```

**Pattern:**
1. Generate nonce, store with expiration (e.g., 5 minutes)
2. Include nonce in message user signs
3. Verify signature includes expected nonce
4. Mark nonce as used
5. Cleanup expired nonces periodically

---

### Token Distribution (Batch Transfers)

**Library:** No additional library needed for basic distribution
**Confidence:** HIGH
**Rationale:**
- Use `@solana/web3.js` Transaction with multiple instructions
- Batch up to ~20 transfers per transaction (compute budget dependent)

**For large-scale airdrops (1000+ recipients):**
**Library:** Consider `Streamflow` or build custom batching
**Confidence:** MEDIUM
**Rationale:** Streamflow handles 1M+ recipient distributions but adds external dependency. For <1000 recipients, custom batching is sufficient.

**Batching Pattern:**
```typescript
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

async function batchTransfer(
  transfers: Array<{ recipient: PublicKey; amount: bigint }>,
  batchSize = 20
) {
  for (let i = 0; i < transfers.length; i += batchSize) {
    const batch = transfers.slice(i, i + batchSize);
    const tx = new Transaction();

    for (const { recipient, amount } of batch) {
      const recipientAta = await getAssociatedTokenAddress(mint, recipient);
      // Add create ATA instruction if needed
      // Add transfer instruction
    }

    await sendAndConfirmTransaction(connection, tx, [payer]);
  }
}
```

---

## What NOT to Use

### tweetnacl
**Reason:** Signature malleability vulnerability (GitHub issue #253). Use `@noble/ed25519` instead.

### @solana/web3.js 2.x (for now)
**Reason:** Ecosystem not ready. @solana/spl-token 0.4.x requires 1.x. Migrate later when Anchor and ecosystem support improves.

### Drizzle ORM (for this feature)
**Reason:** Overkill for volume aggregation. better-sqlite3 raw SQL is simpler and the project already uses it.

### External rewards platforms (Streamflow, etc.)
**Reason:** For a rewards program of this scale (<10K users initially), native implementation is simpler and avoids external dependencies. Reconsider if distribution scale exceeds 10K+ recipients per batch.

### Session-based wallet auth libraries
**Reason:** OpenFacilitator already has Better Auth for user sessions. Wallet verification is purely for "prove ownership" not "login with wallet."

---

## Integration Notes

### Existing Stack Compatibility

| Existing | New Addition | Compatible? |
|----------|--------------|-------------|
| @solana/web3.js 1.98.4 | @noble/ed25519 3.0.0 | Yes - independent crypto library |
| @solana/spl-token 0.4.14 | - | Already suitable for transfers |
| better-sqlite3 11.6.0 | - | Already suitable for aggregation |
| Better Auth | - | Complements - user auth vs wallet ownership |
| bs58 6.0.0 | - | Already in project, used for address encoding |

### New Dependencies Summary

```bash
# Only one new dependency needed:
pnpm add @noble/ed25519@^3.0.0
```

### Database Schema Additions

```sql
-- Registered pay-to addresses
CREATE TABLE registered_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet_address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'solana',
  verified_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Signature nonces for replay protection
CREATE TABLE signature_nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  used_at INTEGER,
  expires_at INTEGER NOT NULL
);

-- Volume tracking (may already exist, extend as needed)
CREATE TABLE volume_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  total_volume_usd INTEGER NOT NULL, -- Store as cents
  transaction_count INTEGER NOT NULL,
  calculated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Reward claims
CREATE TABLE reward_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  volume_snapshot_id TEXT REFERENCES volume_snapshots(id),
  token_amount TEXT NOT NULL, -- Store as string for bigint precision
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  tx_signature TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  processed_at INTEGER
);

CREATE INDEX idx_claims_user ON reward_claims(user_id);
CREATE INDEX idx_claims_status ON reward_claims(status);
```

---

## Sources

### Signature Verification
- [@noble/ed25519 npm](https://www.npmjs.com/package/@noble/ed25519) - Latest version 3.0.0
- [noble-ed25519 GitHub](https://github.com/paulmillr/noble-ed25519) - Security properties documentation
- [tweetnacl malleability issue](https://github.com/dchest/tweetnacl-js/issues/253) - Known vulnerability
- [Solana web3.js tweetnacl replacement investigation](https://github.com/solana-labs/solana/issues/26933)

### Solana SDK
- [@solana/web3.js npm](https://www.npmjs.com/package/@solana/web3.js) - Version 1.98.4
- [@solana/spl-token npm](https://www.npmjs.com/package/@solana/spl-token) - Version 0.4.14
- [Solana Cookbook - Sign Message](https://solana.com/developers/cookbook/wallets/sign-message)
- [Helius - web3.js 2.0 migration](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk)

### SPL Token Transfers
- [QuickNode SPL Transfer Guide](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-transfer-spl-tokens-on-solana)
- [Solana Token Basics](https://solana.com/docs/tokens/basics/transfer-tokens)
- [Helius Token Transfer Guide](https://www.helius.dev/blog/solana-dev-101-how-to-transfer-solana-tokens-with-typescript)

### Sign In With Solana
- [@web3auth/sign-in-with-solana](https://www.npmjs.com/package/@web3auth/sign-in-with-solana) - Version 5.0.0
- [SIWS Verification Docs](https://siws.web3auth.io/verify)
- [Phantom SIWS GitHub](https://github.com/phantom/sign-in-with-solana)

### Nonce & Replay Protection
- [Solana Durable Nonces](https://solana.com/developers/courses/offline-transactions/durable-nonces)
- [Helius Durable Nonces](https://www.helius.dev/blog/solana-transactions)

### Token Distribution
- [Streamflow Token Distribution](https://streamflow.finance/)
- [Solana Airdrop Best Practices](https://www.blockchainappfactory.com/blog/solana-token-airdrop-best-practices-for-user-growth/)
