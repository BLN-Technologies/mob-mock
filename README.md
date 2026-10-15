# Cargo V1 Mobile

**Trusted Agricultural Marketplace Infrastructure for Rwanda**  
**Version:** 1.0 (MVP)  
**Platform:** Android first (React Native + TypeScript + Expo SDK 52)  
**Authority:** Cargo V1 Software Requirements Specification (SRS), October 2026  

---

## 🌾 Overview
Cargo is a Rwandan agricultural technology startup building a trusted, digitally managed marketplace that connects cooperatives and organized farm groups with institutional bulk buyers.

Cargo is not an unrestricted peer-to-peer shop. It is a **managed marketplace**. Software and Cargo staff work together to verify organizations, confirm harvest-ready supply, inspect and grade produce in the field, coordinate pooled orders, confirm payment before dispatch, record delivery, handle disputes, and create traceable trade records.

---

## 📱 Supported Mobile Roles & Architecture

1. **Cooperative Leader (Supplier):**
   - Active lots, pending inspections, in-progress orders, expected payouts.
   - Guided **Harvest Lot Declaration Wizard** enforcing **BR-01** (harvest-ready only; no future crops).
   - Allocation confirmation, trade history, and offline lot draft preparation.

2. **Cargo Field Agent:**
   - Assigned field tasks (Supplier verification visits & Lot quality grading).
   - Standardized grading forms (Moisture %, foreign matter, defective grain) with real-time grade calculations (Grade A, B, C, Reject).
   - **Offline-First Operation (FR-QA-03, NFR-OFF-01):** Works without connectivity, stores to persistent local queue (`@cargo_offline_queue`), and syncs idempotently when reconnected.
   - Immutable grading history (FR-QA-05).

3. **Institutional Buyer (Mobile Extension Scope):**
   - Verified produce catalogue with multi-attribute filtering (Crop, Grade, Quantity, District).
   - **Strict Privacy Enforcement (BR-05, NFR-PRV-03):** Private cooperative phone numbers and exact farm coordinates are omitted by domain projection.
   - Institutional procurement requests posting.
   - Pooled offers review with transparent negotiation timeline.
   - Consequential **Offer Acceptance** with **Atomic Stock Reservation** across all allocated lots (FR-REQ-06).
   - Milestone tracking with simulated Mobile Money / Bank Transfer payment (BR-03: payment required before dispatch).
   - Delivery receipt inspection with Dispute trigger (holding affected settlement).

4. **Cargo Administrator:**
   - Receives an informative, safe **Web Handoff Screen** directing to the Cargo Web Back Office (`https://admin.cargo.rw`).

---

## 🔑 Documented Demo Accounts

Each account is pre-configured and accessible via the **Quick Fill** buttons on the Login screen:

| Role | Name | Phone / Login | Password | Default Language |
| :--- | :--- | :--- | :--- | :--- |
| **Supplier** | Jean-Pierre Nshimiyimana | `+250788111222` | `password123` | Kinyarwanda (`rw`) |
| **Field Agent** | Alice Mukamana | `+250788333444` | `password123` | Kinyarwanda (`rw`) |
| **Buyer** | David Gasana | `+250788555666` | `password123` | English (`en`) |
| **Administrator** | Christian Kagame | `+250788999000` | `password123` | English (`en`) |

*Note: For the simulated Two-Factor Verification (OTP), any 6-digit code (e.g. `123456`) is accepted.*

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20.x` or later
- npm `v10.x` or later

### Installation & Execution
```bash
# Install dependencies
npm install

# Run TypeScript typecheck (Zero errors)
npm run typecheck

# Run automated domain & business rule test suite (24 tests pass)
npm test

# Start the Expo development server
npm start
```

Press `a` in the terminal for Android emulator (if Android SDK is installed), or `w` for Web preview, or scan the QR code with the Expo Go app on your physical Android phone.

---

## 🛠️ Testing & Verification
The test suite validates:
- **BR-01:** Harvest-ready declaration rules (future harvest dates & unconfirmed harvests rejected).
- **BR-02:** Buyer catalogue visibility gate (uninspected lots are never visible to buyers).
- **BR-03:** Payment gate before dispatch (disallowing dispatch of unpaid orders).
- **BR-04:** Payout eligibility upon delivery acceptance or dispute hold.
- **BR-05:** Buyer privacy projection (private supplier contacts stripped).
- **Currency & Metric Units:** Whole Rwandan Francs (`RWF`) integer calculations and metric ton display.

Run tests at any time with:
```bash
npm test
```

---

## 🔄 Demo Reset
To clear all local test lots, orders, disputes, and offline queues back to the original seed data, navigate to **Profile > Demo Environment Actions > Reset Demo Data**.
