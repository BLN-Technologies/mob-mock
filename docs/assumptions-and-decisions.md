# Cargo V1 Mobile Architectural Assumptions & Decisions Record (ADR)

**Version:** 1.0  
**Date:** October 2026  
**Status:** Living Document  
**Authority:** Cargo V1 Software Requirements Specification (SRS), Cargo V1 Module Guide, Master Build Prompt v2  

---

## 1. Context & Purpose
This document logs every technical decision, domain interpretation, safe fallback, and architectural constraint established for the Cargo V1 Mobile application.

---

## 2. Decision Log

### ADR-01: Framework and Native Tooling
- **Decision:** Use **Expo SDK 52 (latest stable)** with React Native and Strict TypeScript.
- **Rationale:** Provides stable cross-platform native capabilities, excellent asset handling, secure store primitives, file system access, and fast reproducible builds.
- **Android Target:** Android 8.0+ (API level 26+), matching SRS section 2.4.
- **Status:** Approved.

### ADR-02: Role Boundaries and Navigation Shells
- **Decision:** Dedicated, role-specific navigation stacks for **Supplier**, **Field Agent**, and **Buyer Extension**. Administrators get a clear "Web Handoff" route.
- **Rationale:** Prevents role bleeding, keeps code modular, eliminates dashboard flashes during session bootstrap, and honors the SRS specification where admins operate on web.
- **Status:** Approved.

### ADR-03: Currency and Unit Standards
- **Decision:**
  - **Currency:** Rwandan Francs (`RWF`), stored strictly as whole 64-bit integers. No float rounding errors.
  - **Quantity:** Kilograms (`kg`), stored canonically as numbers. Converted to metric tons (`t = kg / 1000`) for display when quantities exceed 1,000 kg.
  - **Date & Time:** UTC ISO strings internally; formatted in Central Africa Time (CAT, UTC+2) using `DD/MM/YYYY` presentation.
- **Rationale:** Aligns with Rwandan commerce standards and SRS Section 5.6.
- **Status:** Approved.

### ADR-04: Offline-First Queue & Idempotency
- **Decision:** Use a persistent SQLite/AsyncStorage local action queue with:
  - Client-generated stable UUID operation IDs (`opId`).
  - Payload versioning and retry counts.
  - Explicit queue states: `Local Draft`, `Queued`, `Syncing`, `Synced in demo mode`, `Failed`, `Needs attention`.
  - Server-authoritative conflict resolution (the simulated backend state wins if newer).
- **Rationale:** Field agents in rural Rwanda operate under intermittent connectivity; grading and visit records must never be lost or silently duplicated.
- **Status:** Approved.

### ADR-05: Marketplace Anonymity & Data Protection
- **Decision:** Implement domain projection wrappers (`BuyerLotProjection`) that strip cooperative name, contact person, phone number, and exact coordinates from buyer-facing views before they reach UI components.
- **Rationale:** Protects the Cargo managed marketplace model from off-platform bypass (SRS Business Rule BR-05, NFR-PRV-03).
- **Status:** Approved.

### ADR-06: Strict Domain Gates on Trade Lifecycles
- **Decision:** Enforce core business rules in the domain/service layer:
  - `BR-01`: Lot declaration rejects any item without harvest confirmation.
  - `BR-02`: A lot is invisible to buyers until both field graded (`FR-QA-02`) AND administrator approved (`FR-QA-06`).
  - `BR-03`: Order dispatch is physically impossible in the service layer unless status is `Paid`.
  - `BR-04`: Supplier payout eligibility is triggered only after buyer acceptance or approved dispute resolution.
  - `BR-07`: Grading records and ledger entries are strictly append-only.
- **Rationale:** Guarantees platform trust and prevents UI bypass.
- **Status:** Approved.

### ADR-07: Design System Color Palette & Typography
- **Decision:** Directly adopt the visual language defined in `Cargo Agricultural Trade Design System.png`:
  - Primary Green: `#0FAA38`
  - Deep Forest Brand: `#0B3B24`
  - Secondary Green: `#22C55E`
  - Accent Green: `#06EFAC`
  - Neutral Dark: `#0F172A`
  - Neutral Gray: `#6B7280`
  - Background Gray: `#F5F4F6`
  - Surface White: `#FFFFFF`
  - Typography: System default with Inter metrics, large touch targets (>=44-48dp).
- **Rationale:** Matches approved brand identity and ensures high contrast outdoors.
- **Status:** Approved.

### ADR-08: Honest Mock Service Adapters
- **Decision:** In Phase 1-8, provide zero-backend mock adapters that adhere to typed service interfaces (`contracts/`). Seed data is realistic, deterministic, and persistent. Simulated network delay, offline simulation toggles, and demo reset capabilities are provided.
- **Rationale:** Allows complete, honest end-to-end verification without claiming live backend integration prematurely.
- **Status:** Approved.

---

## 3. Pending Questions & Owner Decision Points

| Item | Description | Safe Reversible Default Chosen | Status |
| :--- | :--- | :--- | :--- |
| **Q-01: Seed Crop Catalogue** | Default crops for initial demo | Maize (Nyirakaragaza & hybrid), Dry Beans, Irish Potatoes | Working default applied |
| **Q-02: Cargo Commission Rate** | Platform fee rate calculation | Default 5% buyer fee or 3% supplier commission from settings | Configurable via settings service |
| **Q-03: Quality Tolerance Limit** | Quantity/quality deviation threshold prompting dispute | 5% quantity tolerance; grade mismatch triggers dispute prompt | Configurable via settings service |
| **Q-04: Default Language** | Default locale upon fresh install | Kinyarwanda (`rw`) for Supplier & Agent; English (`en`) for Buyer | Configurable via settings |
