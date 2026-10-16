# CARGO MOBILE V1 — RELEASE READINESS & SECURITY HARDENING REGISTER
**Application:** Cargo Mobile V1 (Rwanda Agricultural Trading Platform)  
**Package Identifier:** `rw.cargo.mobile`  
**Current Version:** 1.0.0 (Build `2026.10.1`)  
**Target Environment:** Android & iOS (Managed Expo SDK 57 / React Native 0.86.3)  
**Status:** **RELEASE-READY (PILOT / DEMO CERTIFIED)**

---

## 1. Executive Summary & Repository Baseline

Cargo Mobile V1 is an offline-first agricultural trade execution mobile application connecting Rwandan farmer cooperatives and suppliers with institutional buyers. The app coordinates the complete trade lifecycle:
1. Role-specific registration and verification onboarding (Supplier, Buyer, Field Agent).
2. Harvest lot declarations with readiness confirmations (BR-01).
3. Field agent quality grading (moisture, defects, foreign matter).
4. Durable offline inspection storage, crash reconciliation, and idempotent queue sync.
5. Administrative review and decoupled marketplace visibility (BR-02).
6. Institutional buyer discovery, sourcing requests, counteroffers, and contract confirmation.
7. Payment escrow gates prior to consignment dispatch (BR-03).
8. Logistics delivery receipts, buyer acceptance, and dispute-controlled settlement freezes (BR-04).
9. Farmer privacy protection prohibiting buyer-facing disclosure of private farm coordinates and individual phone numbers (BR-05).

The application currently operates with high-fidelity, deterministic mock services that simulate the future NestJS/PostgreSQL backend while strictly honoring the Cargo V1 SRS business invariants.

---

## 2. Release-Blocker Register (P0 / P1 / P2 / P3)

| ID | Priority | Module / Area | Issue & Impact | Reproduction Steps | Fix Implemented | Verification Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RB-01** | **P0** | Trading / Logistics | **Dispatching unescrowed consignment**: Supplier could potentially dispatch goods before buyer payment confirmed. | Trigger dispatch on an order in `CONFIRMED` or `PAYMENT_PENDING` status. | Enforced BR-03 in domain `validateOrderTransition` and `orderService.dispatchOrder`. Order MUST be in `PAID` status and `paymentStatus === CONFIRMED`. | **VERIFIED:** Rejection verified in automated Suite 15 & 16. |
| **RB-02** | **P0** | Catalog / Operations | **Premature Buyer Visibility**: Inspecting or syncing an offline inspection could make lot visible to buyers before admin approval. | Complete field inspection offline, restore connectivity, and trigger sync. | Enforced BR-02 in `mockSyncAdapter` and `lotWorkflow.ts`. Sync sets `lot.grade` but strictly leaves `adminApprovedAt` undefined and status as `SUBMITTED`. | **VERIFIED:** Verified in automated Suite 13 & 21. |
| **RB-03** | **P0** | Storage / Field Ops | **Offline Queue Crash Corruption**: App termination while an inspection sync is in flight left items abandoned in `SYNCING` state. | Force quit app mid-network sync; restart app. | Added `inspectionRepository.reconcileStartupState()` which detects orphaned `SYNCING` operations and safely reverts them to `RETRY_SCHEDULED`. | **VERIFIED:** Verified in automated Suite 20. |
| **RB-04** | **P0** | Financials / Settlements | **Dispute Settlement Leakage**: Disbursing settlements while an active quality dispute is open. | Open dispute on an order, attempt `disburseSettlement`. | Enforced BR-04 in `settlementWorkflow.ts` and `settlementService`. Disputes pause all constituent settlements; disbursement rejected until resolved. | **VERIFIED:** Verified in automated Suite 15 & 24. |
| **RB-05** | **P1** | Field Inspections | **Duplicate Sync Multi-Grading**: Retrying a timed-out network sync creates duplicate inspection records. | Trigger multiple rapid retries of an enqueued inspection. | Implemented client-side stable idempotency keys `idem-${gradingRecord.id}` and adapter idempotency cache `processedIdempotencyKeys`. | **VERIFIED:** Verified in automated Suite 18. |
| **RB-06** | **P1** | Security / Privacy | **Farmer Privacy Disclosure**: Individual farmer phone numbers or private warehouse coordinates exposed to wholesale buyers. | Fetch catalog lots as an institutional buyer. | Created `projectLotForBuyer` and `projectAllocationsForBuyer` (BR-05) stripping `supplierId`, phone numbers, and warehouse coordinates. | **VERIFIED:** Verified in automated Suite 13 & 21. |
| **RB-07** | **P1** | Security / Auth | **Role Escalation / Cross-Role Access**: Public registration self-assigning `ADMINISTRATOR` or `FIELD_AGENT` roles. | Attempt to register as Agent without invite code. | Centralized routing policy in `routingPolicy.ts` and restricted registration in `RegisterScreen.tsx`. Field agents require valid invitation. | **VERIFIED:** Verified in automated Suite 10 & 11. |
| **RB-08** | **P1** | Financials | **Fee Invariant & Rounding Drift**: Fractional RWF or floating-point rounding errors causing `fee + payout != subtotal`. | Execute orders with odd subtotals (e.g. 33,333 RWF). | Centralized `calculateBuyerTotal` and `calculateSupplierPayout` using integer RWF rounding (`Math.round`) ensuring gross value conservation. | **VERIFIED:** Verified in automated Suite 22. |
| **RB-09** | **P2** | Localization | **Untranslated Offline & Synchronization Badges**: Sync error cards and queue filters missing Kinyarwanda translations. | Switch language to `rw` on Offline Queue screen. | Added comprehensive bilingual key dictionaries across `en.ts` and `rw.ts` covering all sync statuses, errors, and actions. | **VERIFIED:** Dual-language verified in UI and TypeScript checks. |
| **RB-10** | **P2** | Offline Banner | **Queue Count Inconsistency**: Banner only counted `QUEUED` and `FAILED` items, ignoring `RETRY_SCHEDULED` or `CONFLICT`. | Enqueue inspection with transient failure. | Updated `OfflineBanner.tsx` to filter `q.status !== SyncStatus.SYNCED`. | **VERIFIED:** Verified in UI and test runs. |
| **RB-11** | **P3** | Packaging | **Transitive Dependency Warnings**: Transitive dev-dependency advisories from Metro build tooling (braces, uuid). | Run `npm audit`. | Audited: warnings are confined to local build tooling (Metro file-map) and do not affect the client runtime bundle. Suppressing with `--force` would cause breaking downgrade to Expo 44. Accepted as dev-tooling risk. | **DOCUMENTED:** Retained in audit register. |

---

## 3. Business Rules Verification Matrix (BR-01 to BR-05)

| Rule | Description | Implementation Enforcement | Test Suite Verification |
| :--- | :--- | :--- | :--- |
| **BR-01** | **Harvest Readiness** | `validateLotDeclaration` rejects future harvest dates, requires explicit harvest confirmation, and validates warehouse readiness details. | **Suite 1 & Suite 16** (100% pass) |
| **BR-02** | **Decoupled Buyer Visibility** | `isLotBuyerVisible` strictly requires `lot.status === VERIFIED`, valid `lot.grade`, and `lot.adminApprovedAt`. Field inspections and offline sync do not unlock buyer visibility. | **Suite 13 & Suite 21** (100% pass) |
| **BR-03** | **Payment Gate Before Dispatch** | `validateOrderTransition` blocks transition to `DISPATCHED` unless `order.status === PAID` and `order.paymentStatus === CONFIRMED`. | **Suite 15 & Suite 16** (100% pass) |
| **BR-04** | **Escrow Protection & Fee Invariant** | Buyer fee exactly 5%; Supplier fee exactly 3%. Integer RWF rounding (`Math.round`). Invariant `grossSubtotal = netPayout + supplierFee`. Disputes freeze affected settlements. | **Suite 14, 15 & Suite 22** (100% pass) |
| **BR-05** | **Farmer Privacy** | `projectLotForBuyer` and `projectAllocationsForBuyer` strip private supplier contact details and warehouse coordinates, exposing only district-level logistics summaries. | **Suite 13 & Suite 21** (100% pass) |

---

## 4. Mobile Security & Data Protection Review

### 4.1 Authentication & Session Hygiene
- **Centralized Session Storage**: Sessions are persisted in `@cargo_session_user` using `@react-native-async-storage/async-storage`.
- **No Password Persistence**: Plaintext passwords and cryptographic hashes are never saved to `AsyncStorage`.
- **Session Reset on Logout**: `authService.logout()` purges the active session user from storage and memory, resetting navigation state to the `WELCOME` destination.
- **Offline Data Retention**: In accordance with Section 5.4, logging out does **not** erase unsynchronized inspection queue items (`@cargo_offline_queue`) or drafts (`@cargo_inspection_drafts`). An agent who logs out or switches accounts retains their collected field data on the device.

### 4.2 Data Minimization & Privacy
- **Redaction Utility**: Created `src/core/logging/logger.ts` which automatically redacts `password`, `token`, `authorization`, `secret`, `tin`, and `nationalId` from all log outputs.
- **Clean Console Output**: Zero raw `console.log`, `console.warn`, or `console.error` calls remain in application source code.
- **Farmer Identity Shielding**: The buyer workspace never queries raw supplier models directly; it uses read-only buyer projections (`BuyerLotProjection`).

### 4.3 Environment Configuration Boundary
- Centralized configuration module (`src/core/config/env.ts`) reading `EXPO_PUBLIC_APP_ENV` (`demo` vs `production`).
- The application explicitly identifies simulated demo features (e.g. `Simulate Demo Payment (Escrow)`, `SIMULATED DEMO ENVIRONMENT`).
- In production mode, mock services are guarded by `assertProductionBackendConfigured()`.

---

## 5. Offline Durability & Recovery Verification

- **Storage Engine**: AsyncStorage with an in-memory fallback map and timeout protection (`withTimeout(..., 400ms)`).
- **Startup Crash Reconciliation**: If the mobile OS terminates the application while an inspection synchronization is in progress (`status: SYNCING`), `inspectionRepository.reconcileStartupState()` recovers the operation to `RETRY_SCHEDULED` on cold boot without losing data.
- **Deterministic Backoff**: Transient network drops trigger exponential backoff ($5\text{s} \rightarrow 10\text{s} \rightarrow 20\text{s} \rightarrow 40\text{s} \rightarrow 80\text{s} \dots$ capped at $300\text{s}$).
- **Concurrency Lock**: Mutual exclusion lock `isSyncInProgress` prevents parallel background workers from double-submitting records.
- **Idempotency**: Retries reuse the client-assigned token `idem-${record.id}`, preventing duplicate lot updates.

---

## 6. Store Readiness Checklist

### Google Play Store (Android)
- [x] Package identifier configured: `rw.cargo.mobile` in `app.json`.
- [x] Adaptive launcher icon and foreground/background assets in `assets/`.
- [x] Splash screen configured with brand color `#0B3B24`.
- [x] Android permissions reviewed (minimal permissions: network state, camera/storage for inspection photos, fine/coarse GPS for on-site inspection tagging).
- [x] Predictive back gesture disabled for modal workflow safety.
- [ ] Signed Release Android App Bundle (`.aab`) generation (Pending production signing keystore).
- [ ] Google Play Console store listing, screenshots, and Rwandan data privacy policy URL (Pending institutional legal URL publishing).

### Apple App Store (iOS)
- [x] iOS bundle identifier alignment and tablet support disabled (`supportsTablet: false`).
- [x] Safe area layout handling via `react-native-safe-area-context` across all notch and Dynamic Island devices.
- [ ] Apple Developer Team provisioning profile and distribution certificates (Pending organization Apple Developer Enterprise account).

---

## 7. Production Backend Integration Requirements

To replace the Phase 4/5 mock service layer with the permanent NestJS / PostgreSQL / Prisma backend:

1. **REST/GraphQL API Client**:
   Implement `ISyncAdapter` and `IAuthService` using `fetch` or `axios` pointed at `EXPO_PUBLIC_API_URL`.
2. **Transactional Server Idempotency**:
   The NestJS backend must accept `Idempotency-Key` headers on `/api/v1/inspections` and store them in an ACID transactional table with unique constraints.
3. **Escrow Gateway Webhooks**:
   Replace `orderService.simulatePayment` with real-time webhooks from a licensed Rwandan payment provider (e.g. MTN MoMo Open API, Airtel Money, or National Bank of Rwanda licensed aggregator).
4. **Trusted NTP Timestamps**:
   All audit timestamps (`gradedAt`, `adminApprovedAt`, `disbursedAt`) must be assigned by backend servers rather than client device clocks.
5. **Direct S3/GCS Pre-Signed Photo Uploads**:
   Inspection photo evidence should be uploaded directly to object storage via pre-signed URLs to preserve bandwidth.
