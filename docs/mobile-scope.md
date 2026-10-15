# Cargo V1 Mobile Scope Specification

**Version:** 1.0  
**Date:** October 2026  
**Status:** Approved for Implementation  
**Authority:** Cargo V1 Software Requirements Specification (SRS), Cargo V1 Module Guide, and Cargo Master Mobile Build Prompt v2  

---

## 1. Executive Summary

Cargo is a Rwandan agricultural technology startup building a trusted, digitally managed marketplace that connects cooperatives and organized farm groups with institutional bulk buyers.

The Cargo V1 system comprises:
1. **Android-First Mobile Application**: Primary interface for Cooperative Leaders (Suppliers) and Cargo Field Agents. Additionally incorporates a high-fidelity **Buyer Mobile Experience** as a documented mobile extension.
2. **Web Application**: Primary interface for Institutional Buyers and Cargo Administrators.
3. **Shared Backend & Database**: Authoritative source of business rules, ledger, permissions, and state transitions (NestJS + PostgreSQL in target architecture; honest local mock service layer in current mobile phase).

---

## 2. In-Scope Mobile Roles & Boundaries

### 2.1 Supplier (Cooperative Leader / Farm Group Representative)
- **Status:** **Core Mandatory Native Scope**
- **Capabilities:**
  - Secure phone/email login, session persistence, OTP demonstration, and logout.
  - Organization profile viewing (verification state: Pending, Verified, Suspended, Rejected).
  - Supplier dashboard showing real local record metrics (active lots, pending inspections, active orders, payouts, notifications).
  - Harvest-ready lot declaration wizard (crop, variety, harvest date verification, quantity in kg, price expectation in RWF, pickup location, photos, inspection availability).
  - Lot lifecycle management: Draft, Submitted, Verified, Reserved, Sold, Rejected, Withdrawn, Expired.
  - Supplier order allocation review and explicit confirmation/decline with reasons.
  - Order milestone tracking: terms acceptance, payment confirmation, dispatch, delivery, buyer acceptance, disputes, settlement hold.
  - Trade history, delivery notes, and invoice record downloads (mock PDFs).
  - Offline lot draft creation and resilient recovery.

### 2.2 Field Agent (Cargo-Appointed Field Operations Worker)
- **Status:** **Core Mandatory Native Scope**
- **Capabilities:**
  - Login via administrator-provisioned account.
  - Task dashboard: Supplier verification visits and lot grading tasks.
  - Supplier verification visit capture (notes, photos, GPS with permission and timestamp).
  - Lot inspection and quality grading based on crop-specific templates (moisture %, foreign matter %, damaged share %, size/count, calculated proposed grade, notes, photos, GPS).
  - Strict immutability of submitted grading records; corrections create new dated versions.
  - **Full Offline-First Operation:**
    - Local draft saving.
    - Persistent local queue surviving app restart.
    - Honest sync queue statuses: `Local Draft`, `Queued`, `Syncing`, `Synced in demo mode`, `Failed`, `Needs attention`.
    - Idempotent deduplication and conflict safety (server authority).

### 2.3 Buyer (Institutional Bulk Sourcing Sourcing Manager)
- **Status:** **Documented Mobile Extension / Demo Scope**
- **Note:** In the wider Cargo platform, buyers also use the web app. This native mobile journey implements the exact same domain models, validation, and rules.
- **Capabilities:**
  - Sign in, simulated OTP, organization profile, approval status.
  - Verified produce discovery: catalogue browse and multi-attribute filter (crop, variety, grade, district, price, availability date).
  - **Privacy Enforcement:** Private supplier name, phone number, and exact coordinates are strictly hidden from buyer views by domain projection.
  - Post guided buyer requests with specifications and expiry.
  - Review pooled or single-supplier offers with transparent negotiation history (accept, decline, counter).
  - Atomic stock reservation upon offer acceptance.
  - Order tracking, electronic terms acceptance, mock payment simulation.
  - Delivery receipt confirmation: record received quantity/quality, attach problem photos, trigger settlement eligibility or open dispute.
  - In-app notification inbox, deep links, trade document previews.

### 2.4 Cargo Administrator
- **Status:** **Out of Native Mobile Scope (Web Application Core)**
- Mobile behavior: An administrator attempting to log in on the mobile app is safely routed to an informative "Administrator Web Handoff" screen explaining that the back office, master settings, user approvals, and pooling controls are operated via the web portal.

### 2.5 Transporter
- **Status:** **Out of Scope for V1**
- Transporters are not system users. Cargo administrators record trip, driver, vehicle, and loading details on their behalf.

---

## 3. Explicitly Out of Scope for V1 Mobile

To maintain architectural integrity and respect SRS constraints, the following are strictly excluded from V1:
1. **Direct EBM/RRA Integration:** Invoices capture external EBM reference numbers and receipt files; no direct automated tax authority API calls are made.
2. **USSD Channels:** Excluded by SRS constraint C-03.
3. **Native iOS App:** Android is the priority platform for V1 (constraint C-06).
4. **Autonomous/Algorithmic Matching:** Offers are pooled and matched with human administrative assistance.
5. **Buyer Credit Terms (Net-15 to Net-60):** Immediate payment confirmation is required before dispatch.
6. **Cargo Banking / Money Holding:** Cargo never acts as a bank or holds funds; real operations use licensed payment partners (MTN MoMo, Airtel Money, bank transfer).
7. **Cold-Chain Sensor Tracking:** Hardware integrations are out of scope.
8. **Sale of Market Data Products:** Excluded from V1.
9. **Fake Simulated Delivery/Payment Pretense:** Mock flows must clearly declare themselves as simulations and never deceive the user.

---

## 4. Key Architectural Constants

- **Canonical Currency:** Whole Rwandan Francs (`RWF`), stored internally as integers (no floating point currency).
- **Canonical Quantity:** Kilograms (`kg`), stored internally as numbers; converted to metric tons (`t`) dynamically for high-quantity presentation (`1 t = 1,000 kg`).
- **Time Zone:** Central Africa Time (`CAT`, UTC+2). Dates displayed as `DD/MM/YYYY`.
- **Localization:** Kinyarwanda (`rw`) and English (`en`). Default for suppliers and field agents is Kinyarwanda.
