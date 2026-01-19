# Features Research: Token Rewards Program

**Domain:** Crypto Token Rewards / Volume-Based Loyalty Program
**Researched:** 2026-01-19
**Confidence:** MEDIUM (WebSearch verified with multiple sources; no Context7 for this domain)

## Table Stakes

Features users expect from any crypto rewards program. Missing these makes the product feel incomplete or untrustworthy.

---

### Progress Dashboard with Real-Time Volume Tracking

**Description:** A dashboard showing current volume processed, threshold progress (e.g., "$847 / $1,000"), and estimated rewards. Users must see where they stand at a glance.

**Complexity:** Medium
**Dependencies:** Transaction log aggregation by verified address; campaign configuration
**User expectation:** 57% of loyalty program members don't know their points balance. Real-time progress visualization is the baseline expectation for any rewards program. MetaMask, Trust Wallet, Crypto.com all provide this.

**Implementation notes:**
- Progress bar visual showing threshold completion percentage
- Current volume amount prominently displayed
- Estimated rewards based on current pool and user's proportional share

**Sources:** [CoinMetro](https://www.coinmetro.com/learning-lab/crypto-loyalty-programs), [BlockApps](https://blockapps.net/blog/comprehensive-comparison-of-crypto-staking-dashboards-which-one-is-right-for-you/)

---

### Wallet Ownership Verification via Signature

**Description:** Users prove they own a Solana address by signing a message with their wallet. This is the standard Web3 authentication pattern - no private keys shared, just cryptographic proof.

**Complexity:** Medium
**Dependencies:** Solana wallet integration (Phantom, Solflare, etc.); signature verification on backend
**User expectation:** Industry standard for Web3. Users signing messages is common across MetaMask, Trust Wallet, and any dApp. Not verifying ownership invites Sybil attacks.

**Implementation notes:**
- Generate unique nonce per verification attempt (prevent replay attacks)
- Support popular Solana wallets (Phantom, Solflare, Backpack)
- Store verified addresses linked to user account
- Allow multiple addresses per user

**Sources:** [QuickNode](https://www.quicknode.com/guides/web3-fundamentals-security/cryptography/verify-message-signature-on-ethereum), [Mesh SDK](https://meshjs.dev/guides/prove-wallet-ownership), [Etherscan](https://etherscan.io/verifiedsignatures)

---

### Claim Flow with On-Chain Transaction

**Description:** When campaign ends and threshold is met, users can claim their $OPEN tokens. Claim triggers SPL token transfer from rewards wallet to user's verified address.

**Complexity:** High
**Dependencies:** Rewards wallet with SPL tokens; signature verification; campaign end date; threshold validation
**User expectation:** The promise of the entire program. Users expect a simple "Claim" button that results in tokens appearing in their wallet. OKX shows rewards sync across platforms instantly.

**Implementation notes:**
- Clear "Claim Available" state when eligible
- Show estimated vs actual rewards (pool distribution may differ from estimates)
- Transaction confirmation with explorer link
- Handle edge cases: wallet not verified, threshold not met, already claimed

**Sources:** [OKX](https://www.okx.com/learn/crypto/how-to-claim-crypto-rewards), [MetaMask Rewards](https://metamask.io/rewards)

---

### Claim History and Transaction Records

**Description:** View past campaigns, claim amounts, and transaction signatures. Users need audit trail for tax purposes and trust verification.

**Complexity:** Low
**Dependencies:** Transaction logging; campaign history storage
**User expectation:** 96% of customers agree loyalty programs need improvement. Transparency is a differentiator for blockchain - users expect immutable records. MetaMask Activity tab shows all reward-earning actions.

**Implementation notes:**
- List of past campaigns with: dates, volume, rewards earned, claim status
- Transaction signature links to Solana explorer
- Export capability for tax reporting

**Sources:** [MetaMask](https://metamask.io/rewards), [Crypto.com](https://help.crypto.com/en/articles/4837927-how-do-i-export-my-transaction-history-exchange), [CoinTracker](https://www.cointracker.io/learn/vesting-period)

---

### Clear Threshold and Campaign Rules Display

**Description:** Users must understand: (1) what threshold they need to hit, (2) when the campaign ends, (3) how rewards are calculated. No hidden terms.

**Complexity:** Low
**Dependencies:** Campaign configuration; admin UI for campaign management
**User expectation:** 33% of loyalty users highlight difficulties due to non-user-friendly terms. Crypto programs especially need transparency given trust deficit in the space.

**Implementation notes:**
- Campaign period clearly displayed (start/end dates)
- Threshold amount ($1,000/month)
- Pool size and distribution mechanism explanation
- Multiplier rules (2x for facilitator owners)

**Sources:** [CoinMetro](https://www.coinmetro.com/learning-lab/crypto-loyalty-programs), [Capillary Tech](https://www.capillarytech.com/blog/crypto-rewards-in-loyalty-programs/)

---

### Multiple Address Support

**Description:** Users may receive payments to multiple addresses. They should be able to verify and track volume across all their addresses.

**Complexity:** Medium
**Dependencies:** Address verification flow; volume aggregation across addresses
**User expectation:** Common pattern in crypto - users have multiple wallets. MetaMask Portfolio aggregates across multiple accounts and networks.

**Implementation notes:**
- "Add Address" flow for additional wallets
- Volume summed across all verified addresses for threshold calculation
- Clear display of per-address and total volume

**Sources:** [MetaMask Portfolio](https://metamask.io/news/metamask-portfolio-track-and-manage-your-web3-everything), [Zerion](https://zerion.io/crypto-wallet-tracker)

---

## Differentiators

Features that set this apart from standard rewards programs. Not expected, but create competitive advantage.

---

### Multiplier for Facilitator Owners (2x)

**Description:** White-label facilitator owners get 2x rewards multiplier. This incentivizes the higher-value user behavior (running a facilitator, not just using the free one).

**Complexity:** Low
**Dependencies:** Facilitator ownership check (already exists in auth system)
**Why differentiating:** Most rewards programs have tiers, but tying multiplier to platform adoption (not spend) is unique. Trust Wallet locks TWT to increase multiplier; MetaMask gives loyalty bonus based on historical volume.

**Implementation notes:**
- Automatic detection - no user action needed
- Display multiplier badge in dashboard ("2x Active")
- Show both base volume and multiplied volume in progress

**Sources:** [Trust Wallet](https://trustwallet.com/blog/announcements/introducing-trust-premium), [MetaMask Rewards](https://metamask.io/rewards)

---

### Proportional Pool Distribution

**Description:** Rewards pool is split proportionally among qualifying users based on their volume contribution, not first-come-first-served or fixed amounts.

**Complexity:** Medium
**Dependencies:** Campaign pool management; final volume calculation at campaign end
**Why differentiating:** Fair distribution that scales with contribution. Drift Protocol uses linear distribution treating all users equally. Avoids problems of fixed allocation or racing to claim.

**Implementation notes:**
- Campaign pool defined upfront (e.g., 20M $OPEN)
- User's share = (user volume / total qualifying volume) * pool
- Estimates update in real-time but final calculation at campaign end
- Display estimated range (your share if pool stays same vs grows)

**Sources:** [Drift Protocol](https://docs.drift.trade/fuel/overview), [TokenMinds](https://tokenminds.co/blog/token-sales/token-distribution)

---

### Soft Anti-Gaming Metrics (Track, Don't Block)

**Description:** Track suspicious patterns (wash trading, same-address back-and-forth) but don't automatically disqualify in v1. Use data to inform v2 rules.

**Complexity:** Medium
**Dependencies:** Transaction pattern analysis; admin dashboard for metrics
**Why differentiating:** 85% of projects implement anti-Sybil in 2025. However, being too aggressive loses legitimate users. OpenFacilitator's approach: accept gaming as CAC for v1, learn patterns for v2.

**Implementation notes:**
- Flag transactions where from_address == to_address (self-pays)
- Flag high-velocity same-pair transactions
- Admin view of flagged patterns
- No automatic disqualification (soft enforcement)

**Sources:** [Integral](https://integral.xyz/blog/sybil-attacks), [OKX on Sybil](https://www.okx.com/en-eu/learn/irys-airdrop-blockchain-bot-sybil-attacks), [Formo](https://formo.so/blog/what-are-sybil-attacks-in-crypto-and-how-to-prevent-them)

---

### Campaign-Based Time Windows

**Description:** Rewards distributed in campaigns (e.g., Q1 2026) rather than continuous. Creates urgency and clear claim points.

**Complexity:** Low
**Dependencies:** Campaign CRUD in admin; date-based eligibility
**Why differentiating:** Most programs are continuous. Campaigns create events - marketing moments, clear deadlines, defined pools. Drift uses milestone-based campaigns with scaling allocations.

**Implementation notes:**
- Admin creates campaign: name, dates, pool amount, threshold
- Users see active campaign and upcoming campaigns
- Volume only counts during campaign period
- Claims open when campaign ends

**Sources:** [Drift Protocol](https://docs.drift.trade/fuel/overview), [TokenMinds Distribution](https://tokenminds.co/blog/token-sales/token-distribution)

---

### No Expiration on Unclaimed Rewards

**Description:** Unlike traditional loyalty points, unclaimed $OPEN tokens don't expire. Blockchain rewards stay accessible.

**Complexity:** Low (it's the default - you have to build expiration, not the reverse)
**Dependencies:** None - just don't build expiration logic
**Why differentiating:** $360 billion in traditional loyalty points remain unredeemed due to expiration and confusion. Blockchain rewards by nature don't expire - this is a selling point vs traditional programs.

**Implementation notes:**
- No expiration date on claims
- Historical campaigns remain claimable indefinitely
- Clear messaging: "Your rewards never expire"

**Sources:** [Capillary Tech](https://www.capillarytech.com/blog/how-blockchain-technology-is-re-animating-future-of-loyalty-programs/), [CoinMetro](https://www.coinmetro.com/learning-lab/crypto-loyalty-programs)

---

### Free User Rewards (Without Creating Facilitator)

**Description:** Users processing volume through the free facilitator (pay.openfacilitator.io) can still earn rewards, just without the 2x multiplier.

**Complexity:** Low
**Dependencies:** Auth system extension for "rewards-only" accounts
**Why differentiating:** Lowers barrier to entry. Most B2B rewards require using paid tier. OpenFacilitator rewards free users too - funnel into facilitator ownership over time.

**Implementation notes:**
- Sign up for rewards without creating facilitator
- Track volume from free facilitator transactions
- Upgrade path clearly shown ("Get 2x by launching your facilitator")

**Sources:** Project requirement - unique to OpenFacilitator model

---

## Anti-Features

Things to deliberately NOT build. Common mistakes in this domain that would hurt the product.

---

### Immediate Token Unlocks (No Vesting)

**Why exclude:** Industry standard is vesting to prevent dump-and-run. However, for a volume rewards program where users EARNED tokens through activity, immediate unlock is appropriate. Vesting makes sense for team/investor allocations, not earned rewards.

**Risk if included:** Vesting on earned rewards feels like punishment - users did the work, now they're locked out. Trust Wallet and MetaMask both allow immediate access to earned rewards.

**Recommendation:** Ship with immediate claim availability. Monitor for rapid sell pressure. Consider optional "stake for bonus" later.

**Sources:** [TokenMinds Vesting](https://tokenminds.co/blog/token-sales/vesting-crypto), [Liquifi Benchmarks](https://www.liquifi.finance/post/token-vesting-and-allocation-benchmarks)

---

### KYC Requirements

**Why exclude:** Web3 users value privacy and will not complete identity checks for a rewards program. CAPTCHAs and KYC stop real users more than Sybil attackers.

**Risk if included:** Drop in participation. KYC friction is acceptable for exchanges (regulatory requirement) but inappropriate for voluntary rewards. Users will simply not participate.

**Recommendation:** Wallet signature verification is sufficient proof of ownership. Accept some gaming as CAC.

**Sources:** [Formo on Sybil](https://formo.so/blog/what-are-sybil-attacks-in-crypto-and-how-to-prevent-them), [TokenMinds Sybil](https://tokenminds.co/blog/sybil-attack-and-sybil-resistance)

---

### Complex Tier Systems

**Why exclude:** Tiers add cognitive overhead. OpenFacilitator has exactly two tiers: regular users (1x) and facilitator owners (2x). That's it. Simple to understand, simple to implement.

**Risk if included:** Confusing rewards structures frustrate 54% of users. Multi-tier systems require ongoing balance tuning. Trust Wallet's 3-tier system requires constant UI real estate for tier status.

**Recommendation:** Keep binary multiplier (1x vs 2x). Add tiers only if user demand is clear post-launch.

**Sources:** [CCN on Crypto Programs](https://www.ccn.com/education/crypto/crypto-loyalty-programs-explained/), [WP Loyalty](https://wployalty.net/quick-guide-to-tiered-loyalty-program-with-examples/)

---

### Gamification Features (Daily Check-ins, Streaks, Quests)

**Why exclude:** This is a volume-based rewards program, not an engagement farm. Gamification (Trust Wallet's daily check-ins, MetaMask's quest system) makes sense for wallet apps trying to increase DAU. OpenFacilitator rewards actual payment volume - adding gamification dilutes the value prop.

**Risk if included:** Attracts engagement farmers rather than volume processors. Splits engineering focus. Creates expectation of continuous feature expansion.

**Recommendation:** Rewards tied to real economic activity (volume processed) only. No arbitrary engagement mechanics.

**Sources:** [Trust Wallet Premium](https://trustwallet.com/blog/announcements/introducing-trust-premium), [Capillary Gamification](https://www.capillarytech.com/blog/crypto-rewards-in-loyalty-programs/)

---

### Leaderboards

**Why exclude:** Explicitly out of scope per PROJECT.md. Additionally, leaderboards in crypto attract gaming/manipulation and create adversarial dynamics.

**Risk if included:** Gaming incentive increases. Privacy concerns (volume is financial data). Complexity for limited value in v1.

**Recommendation:** Defer to post-launch. Collect data on whether users want to compare. If implemented later, consider opt-in only.

**Sources:** Project constraint

---

### Real-Time Notifications

**Why exclude:** Explicitly out of scope per PROJECT.md ("Email notifications - nice to have, not MVP"). Building notification infrastructure is significant scope for v1.

**Risk if included:** Engineering time diverts from core functionality. Users may not want email about rewards (spam fatigue).

**Recommendation:** Dashboard-only for v1. Notification system can be added post-launch via webhook infrastructure that already exists.

**Sources:** Project constraint

---

### Automatic Anti-Sybil Blocking

**Why exclude:** Explicitly out of scope per PROJECT.md ("Anti-gaming enforcement - track metrics but don't block anyone for v1"). False positives lose legitimate users.

**Risk if included:** Legitimate users flagged as Sybil and blocked. Support burden for appeals. Gaming is acceptable CAC - don't block revenue.

**Recommendation:** Track patterns, build data, inform v2 rules. Let humans review suspicious activity rather than automated blocking.

**Sources:** Project constraint, [HackerNoon on Token Rewards](https://hackernoon.com/what-is-wrong-with-token-rewards-and-how-to-fix-it)

---

### Token Trading/Staking Within Platform

**Why exclude:** OpenFacilitator is a payment facilitator, not an exchange or DeFi platform. Users can trade/stake $OPEN elsewhere after claiming.

**Risk if included:** Massive regulatory complexity. Security audit requirements. Diverts from core mission.

**Recommendation:** Issue tokens to user wallets. What users do with tokens after is their business.

**Sources:** Scope discipline

---

## Feature Dependencies

```
Campaign Management (Admin)
    └── Campaign Display (User Dashboard)
        └── Progress Tracking
            └── Volume Aggregation
                └── Address Verification
                    └── Wallet Connection

Claims Flow
    └── Threshold Validation
        └── Volume Aggregation
            └── Address Verification
    └── Campaign End Date
        └── Campaign Management
    └── SPL Token Transfer
        └── Rewards Wallet Setup

Multiplier (2x)
    └── Facilitator Ownership Check
        └── Existing Auth System
```

**Critical path for MVP:**
1. Address verification (wallet signature)
2. Volume aggregation from transactions
3. Campaign management (admin CRUD)
4. Progress dashboard
5. Claims flow with SPL transfer

---

## MVP Feature Set

Based on table stakes analysis and project constraints:

### Must Have (Launch Blockers)
1. **Progress Dashboard** - Volume, threshold, estimated rewards
2. **Address Verification** - Solana signature flow
3. **Claim Flow** - SPL token transfer when eligible
4. **Campaign Display** - Active campaign rules and dates
5. **Claim History** - Past claims with transaction links
6. **2x Multiplier** - Automatic for facilitator owners

### Should Have (First Month Post-Launch)
7. Multiple address support
8. Soft anti-gaming metrics (admin view)
9. Campaign history view

### Could Have (Q2 2026)
10. Export for tax reporting
11. Upcoming campaigns preview

### Won't Have (By Design)
- Leaderboards
- Email notifications
- KYC
- Complex tier systems
- Gamification
- Automatic Sybil blocking
- In-app token trading

---

## Sources

**Crypto Rewards Programs:**
- [CoinMetro - Crypto Loyalty Programs](https://www.coinmetro.com/learning-lab/crypto-loyalty-programs)
- [CCN - 4 Crypto Rewards Programs Revolutionizing Loyalty](https://www.ccn.com/education/crypto/crypto-loyalty-programs-explained/)
- [Capillary Tech - Crypto Rewards Redefining Loyalty](https://www.capillarytech.com/blog/crypto-rewards-in-loyalty-programs/)
- [Enable3 - Blockchain Loyalty Program Guide](https://enable3.io/blog/blockchain-loyalty-program-guide)

**Wallet/Platform References:**
- [MetaMask Rewards](https://metamask.io/rewards)
- [Trust Wallet Premium](https://trustwallet.com/blog/announcements/introducing-trust-premium)
- [Crypto.com Rewards+](https://help.crypto.com/en/articles/8581653-rewards-program)
- [OKX - How to Claim Crypto Rewards](https://www.okx.com/learn/crypto/how-to-claim-crypto-rewards)

**Technical Implementation:**
- [QuickNode - Verify Message Signature](https://www.quicknode.com/guides/web3-fundamentals-security/cryptography/verify-message-signature-on-ethereum)
- [Mesh SDK - Prove Wallet Ownership](https://meshjs.dev/guides/prove-wallet-ownership)
- [Etherscan - Verified Signatures](https://etherscan.io/verifiedsignatures)

**Anti-Sybil & Distribution:**
- [Formo - Sybil Attacks in Crypto](https://formo.so/blog/what-are-sybil-attacks-in-crypto-and-how-to-prevent-them)
- [Integral - Combating Sybil Attacks](https://integral.xyz/blog/sybil-attacks)
- [Drift Protocol - FUEL Overview](https://docs.drift.trade/fuel/overview)
- [TokenMinds - Token Distribution](https://tokenminds.co/blog/token-sales/token-distribution)

**Vesting & Tokenomics:**
- [Liquifi - Vesting Benchmarks](https://www.liquifi.finance/post/token-vesting-and-allocation-benchmarks)
- [TokenMinds - Vesting Crypto](https://tokenminds.co/blog/token-sales/vesting-crypto)

**Lessons Learned:**
- [HackerNoon - What's Wrong With Token Rewards](https://hackernoon.com/what-is-wrong-with-token-rewards-and-how-to-fix-it)
- [Snips - 5 Lessons From a Failed Token Sale](https://medium.com/snips-ai/5-lessons-from-a-failed-token-sale-410e47a66647)

---

*Research completed: 2026-01-19*
