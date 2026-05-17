# Phase 22: Storefronts Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 22-storefronts-removal
**Areas discussed:** Public /store endpoint handling, Migration shape & idempotency, image_url column on payment_links, Commit/plan granularity

---

## Public /store Endpoint Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Remove routes entirely | Delete handlers. Express returns default 404. Simplest, matches 'no references' success criterion. | ✓ |
| 410 Gone with JSON body | Stub handlers returning 410 with {error: 'storefronts removed'}. Signals intentional removal. | |
| Redirect /store → /pay landing | Send /store traffic to per-facilitator pay index. Risk of redirect loops if landing doesn't exist. | |

**User's choice:** Remove routes entirely
**Notes:** Aligns with the milestone's removal-only posture. No external compatibility commitments to preserve.

---

## Migration Shape & Idempotency

| Option | Description | Selected |
|--------|-------------|----------|
| New 004_drop_storefronts migration + remove from bootstrap | Add drop migration with IF EXISTS, remove CREATE TABLE blocks + indexes from db/index.ts. Idempotent on fresh and existing DBs. | ✓ |
| Only remove bootstrap, no drop migration | Fresh DBs never create tables; existing prod DBs keep dead tables until manually dropped. | |
| Drop migration only, leave bootstrap | Migration drops, bootstrap recreates on next start. Footgun. | |

**User's choice:** New 004_drop_storefronts migration + remove from bootstrap
**Notes:** Standard pattern. Drop join table before parent (FK).

---

## image_url Column on payment_links

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the column | Products use image_url on /pay/:slug pages independently of storefronts. Column is part of product domain now. | ✓ |
| Drop the column too | Cleaner, but breaks product image rendering and any clients setting it. | |
| Investigate first | Have researcher confirm usage outside storefronts before deciding. | |

**User's choice:** Keep the column
**Notes:** Treat image_url as a product-domain attribute going forward, not storefront-coupled.

---

## Commit/Plan Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single atomic plan | One plan: routes + db + migration + dashboard + verify. Atomic commit = clean revert. | ✓ |
| Two plans: server then dashboard | Risk: dashboard build breaks between commits if any other dashboard work lands between them. | |
| Three plans: db → routes → dashboard | Most granular. Overkill for ~1000 LOC of pure deletion. | |

**User's choice:** Single atomic plan
**Notes:** Pure deletion across ~1000 LOC — coordinated atomic change is lower-risk than splitting.

---

## Claude's Discretion

- Order of file deletions inside the plan.
- Mechanical choice of `git rm` vs `rm` for the two whole-file deletions.
- Specific grep invocation used for verification (must satisfy success criterion #1).

## Deferred Ideas

None — discussion stayed strictly within Phase 22 scope. Rewards-tab cleanup in `dashboard/[id]/page.tsx` is explicitly Phase 24's job.
