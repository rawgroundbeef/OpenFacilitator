# Requirements: OpenFacilitator Rewards Program

**Defined:** 2026-01-19
**Core Value:** Users who process volume through OpenFacilitator get rewarded with $OPEN tokens

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Accounts

- [ ] **AUTH-01**: Free users can register for rewards with email and Solana wallet address
- [ ] **AUTH-02**: Existing Better Auth users can link their account to rewards
- [ ] **AUTH-03**: User can connect Solana wallet (Phantom, etc.) for claiming
- [ ] **AUTH-04**: User can connect EVM wallet for address verification
- [ ] **AUTH-05**: Admin users identified via config-based check (ADMIN_USER_IDS env var)

### Address Management

- [ ] **ADDR-01**: User can add Solana pay-to address to track
- [ ] **ADDR-02**: User can add EVM pay-to address to track
- [ ] **ADDR-03**: User can verify Solana address ownership via message signature
- [ ] **ADDR-04**: User can verify EVM address ownership via message signature
- [ ] **ADDR-05**: User can view list of tracked addresses with verification status
- [ ] **ADDR-06**: User can remove a tracked address
- [ ] **ADDR-07**: User can track multiple addresses per account

### Volume Tracking

- [ ] **VOL-01**: System aggregates volume from transaction logs for verified addresses
- [ ] **VOL-02**: Volume excludes self-transfers (same from/to address)
- [ ] **VOL-03**: System tracks unique_payers metric per address
- [ ] **VOL-04**: Dashboard displays current volume vs threshold (progress bar)
- [ ] **VOL-05**: Dashboard displays estimated rewards based on current volume
- [ ] **VOL-06**: Dashboard displays days remaining in current campaign period

### Campaign System

- [ ] **CAMP-01**: System supports single active campaign at a time
- [ ] **CAMP-02**: Campaign defines: name, pool amount, threshold, dates, multiplier
- [ ] **CAMP-03**: Dashboard displays campaign rules (how rewards calculated)
- [ ] **CAMP-04**: Admin can create new campaigns
- [ ] **CAMP-05**: Admin can edit existing campaigns (before start date)
- [ ] **CAMP-06**: User can view past campaign history with their stats

### Claims

- [ ] **CLAIM-01**: Claim button activates when threshold met AND campaign period ended
- [ ] **CLAIM-02**: System calculates proportional share of pool based on weighted volume
- [ ] **CLAIM-03**: Facilitator owners receive 2x multiplier automatically
- [ ] **CLAIM-04**: System executes SPL token transfer from rewards wallet on claim
- [ ] **CLAIM-05**: Dashboard shows transaction confirmation with Solana explorer link
- [ ] **CLAIM-06**: User can view claim history with status and tx signatures

### Dashboard UI

- [ ] **UI-01**: Rewards tab/section added to existing dashboard
- [ ] **UI-02**: Landing page explains program and shows sign-up CTA
- [ ] **UI-03**: Progress view shows volume, threshold, estimated rewards, multiplier
- [ ] **UI-04**: Address management view for adding/verifying/removing addresses
- [ ] **UI-05**: Claim view shows amount and confirms transaction
- [ ] **UI-06**: History view shows past campaigns and claims

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: User receives email when threshold is reached
- **NOTF-02**: User receives email when claim is available
- **NOTF-03**: User can configure notification preferences

### Analytics

- **ANAL-01**: Admin can view Sybil cluster detection dashboard
- **ANAL-02**: Admin can flag suspicious addresses
- **ANAL-03**: System provides volume diversity metrics

### Enhancements

- **ENH-01**: Auto-populate addresses for facilitator owners from tx history
- **ENH-02**: Leaderboard (opt-in) for top volume users
- **ENH-03**: Referral bonuses for inviting new users

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| KYC verification | Adds friction, not needed for v1 loyalty program |
| Complex tier systems | Simplicity is a feature, 2x multiplier is enough |
| Gamification (badges, streaks) | Distraction from core value |
| Automatic Sybil blocking | Track data for v2, don't block in v1 (acceptable CAC) |
| Vesting on claimed rewards | Adds complexity, defer to v2 if needed |
| In-platform token trading | Not a trading platform |
| Mobile app | Web dashboard sufficient for v1 |
| OAuth login (Google, GitHub) | Email/password + wallet sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Complete |
| AUTH-02 | Phase 3 | Complete |
| AUTH-03 | Phase 9 | Complete |
| AUTH-04 | Phase 4 | Complete |
| AUTH-05 | Phase 2 | Complete |
| ADDR-01 | Phase 3 | Complete |
| ADDR-02 | Phase 4 | Complete |
| ADDR-03 | Phase 3 | Complete |
| ADDR-04 | Phase 4 | Complete |
| ADDR-05 | Phase 5 | Complete |
| ADDR-06 | Phase 5 | Complete |
| ADDR-07 | Phase 5 | Complete |
| VOL-01 | Phase 6 | Complete |
| VOL-02 | Phase 6 | Complete |
| VOL-03 | Phase 6 | Complete |
| VOL-04 | Phase 8 | Complete |
| VOL-05 | Phase 8 | Complete |
| VOL-06 | Phase 8 | Complete |
| CAMP-01 | Phase 7 | Complete |
| CAMP-02 | Phase 7 | Complete |
| CAMP-03 | Phase 7 | Complete |
| CAMP-04 | Phase 7 | Complete |
| CAMP-05 | Phase 7 | Complete |
| CAMP-06 | Phase 7 | Complete |
| CLAIM-01 | Phase 10 | Pending |
| CLAIM-02 | Phase 10 | Pending |
| CLAIM-03 | Phase 10 | Pending |
| CLAIM-04 | Phase 10 | Pending |
| CLAIM-05 | Phase 10 | Pending |
| CLAIM-06 | Phase 10 | Pending |
| UI-01 | Phase 11 | Pending |
| UI-02 | Phase 11 | Pending |
| UI-03 | Phase 8 | Complete |
| UI-04 | Phase 11 | Pending |
| UI-05 | Phase 11 | Pending |
| UI-06 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-20 after Phase 9 completion*
