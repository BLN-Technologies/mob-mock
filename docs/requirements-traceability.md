# Cargo V1 Mobile Requirements Traceability Matrix

**Version:** 1.0  
**Date:** October 2026  
**Status:** Baseline Matrix  
**Source Documents:** Cargo V1 SRS v1.0, Cargo V1 Module Guide, Cargo Master Mobile Build Prompt v2  

---

## 1. Traceability Table

| Req ID | Priority | Description | Roles | Mobile Scope | Target Screen / Module | Test Reference | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | Must | Account registration for supplier, buyer, field agent; admin review | Supplier, Buyer, Agent | Core / Extension | `features/auth/RegisterScreen.tsx`, `authService` | `auth.test.ts` | Planned |
| **FR-AUTH-02** | Must | 4 roles (supplier, field agent, buyer, admin) with least privilege | All | Core / Extension | `domain/permissions/rolePermissions.ts` | `permissions.test.ts` | Planned |
| **FR-AUTH-03** | Must | Phone/email + password login, simulated OTP on 1st login/new device | All | Core / Extension | `features/auth/LoginScreen.tsx`, `OtpModal.tsx` | `auth.test.ts` | Planned |
| **FR-AUTH-04** | Must | Password reset via simulated OTP | All | Core / Extension | `features/auth/ForgotPasswordScreen.tsx` | `auth.test.ts` | Planned |
| **FR-AUTH-05** | Must | Account lockout after repeated failed attempts | All | Core / Extension | `services/mock/mockAuthService.ts` | `lockout.test.ts` | Planned |
| **FR-AUTH-06** | Should | Sign out of all devices | All | Core / Extension | `features/profile/ProfileScreen.tsx` | `session.test.ts` | Planned |
| **FR-AUTH-07** | Must | Suspended user blocked from login and transactions | All | Core / Extension | `services/mock/mockAuthService.ts`, guards | `authGuard.test.ts` | Planned |
| **FR-AUTH-08** | Must | Mobile app keeps session securely between uses | All | Core / Extension | `data/local/secureSessionStorage.ts` | `storage.test.ts` | Planned |
| **FR-ORG-01** | Must | Supplier profile: coop name, reg no, district, sector, contact, capacity | Supplier | Core | `features/organizations/SupplierProfileScreen.tsx` | `org.test.ts` | Planned |
| **FR-ORG-02** | Must | Buyer profile: org name, type, TIN, delivery locations, contacts | Buyer | Mobile Extension | `features/organizations/BuyerProfileScreen.tsx` | `org.test.ts` | Planned |
| **FR-ORG-03** | Must | Verification status (pending, verified, suspended); only verified list | Supplier | Core | `domain/workflows/supplierWorkflow.ts` | `supplierLotGate.test.ts` | Planned |
| **FR-ORG-04** | Must | Field agent records supplier verification visit (notes, photos, GPS) | Agent | Core | `features/inspections/SupplierVisitScreen.tsx` | `visit.test.ts` | Planned |
| **FR-ORG-05** | Must | Admin review & approval of organization | Admin | Simulated Event | `services/mock/mockOrgService.ts` | `approval.test.ts` | Planned |
| **FR-ORG-06** | Should | Multiple named users per organization | All | Architecture Ready | `domain/models/Organization.ts` | `orgModel.test.ts` | Planned |
| **FR-ORG-07** | Should | Trade history and rating summary | All | Core / Extension | `features/profile/TradeHistoryScreen.tsx` | `rating.test.ts` | Planned |
| **FR-LOT-01** | Must | Create lot: crop, variety, quantity, price expectation, dates, location, photo | Supplier | Core | `features/lots/CreateLotWizard.tsx` | `lotCreation.test.ts` | Planned |
| **FR-LOT-02** | Must | Harvest-ready stock only; unharvested produce prohibited | Supplier | Core | `domain/validation/lotValidation.ts` | `lotHarvestRule.test.ts` | Planned |
| **FR-LOT-03** | Must | Lot statuses: Draft, Submitted, Verified, Reserved, Sold, Rejected, Withdrawn, Expired | All | Core / Extension | `domain/enums/LotStatus.ts`, `lotWorkflow.ts` | `lotTransitions.test.ts` | Planned |
| **FR-LOT-04** | Must | Edit/withdraw lot before verification; post-verification requires admin approval | Supplier | Core | `domain/workflows/lotWorkflow.ts` | `lotEditRules.test.ts` | Planned |
| **FR-LOT-05** | Must | Buyer visibility ONLY after field grading + admin verification | Buyer | Core Gate | `domain/workflows/lotWorkflow.ts` | `buyerVisibility.test.ts` | Planned |
| **FR-LOT-06** | Must | Track remaining quantity during partial reservations and sales | All | Core / Extension | `domain/calculations/lotCalculations.ts` | `partialReservation.test.ts` | Planned |
| **FR-LOT-07** | Should | Configurable automated lot expiry with warning | Supplier | Core / Extension | `services/mock/mockLotService.ts` | `lotExpiry.test.ts` | Planned |
| **FR-LOT-08** | Should | Offline lot draft preparation and sync | Supplier | Core | `features/lots/lotDraftStorage.ts` | `lotDraft.test.ts` | Planned |
| **FR-LOT-09** | Must | Deterministic unique lot code format (e.g., LOT-MZ-202610-001) | All | Core / Extension | `domain/models/Lot.ts` | `lotCode.test.ts` | Planned |
| **FR-QA-01** | Must | Crop-specific grading templates (moisture, foreign matter, defect, size, grade) | Agent | Core | `features/inspections/gradingTemplates.ts` | `gradingTemplate.test.ts` | Planned |
| **FR-QA-02** | Must | Field agent records measurements, photos, GPS, submitted grading | Agent | Core | `features/inspections/GradingFormScreen.tsx` | `gradingForm.test.ts` | Planned |
| **FR-QA-03** | Must | Offline grading record with zero data loss on sync | Agent | Core | `features/offline-queue/offlineQueueService.ts` | `offlineGrading.test.ts` | Planned |
| **FR-QA-04** | Must | Calculate/confirm grade via domain rules and display to agent before submit | Agent | Core | `domain/calculations/gradingCalculator.ts` | `gradeCalc.test.ts` | Planned |
| **FR-QA-05** | Must | Immutable grading records; corrections create linked dated record | Agent | Core | `domain/models/GradingRecord.ts` | `immutableGrading.test.ts` | Planned |
| **FR-QA-06** | Must | Admin approves/rejects graded lot; feedback shown to supplier | Admin, Supplier | Core / Simulated | `services/mock/mockGradingService.ts` | `adminApproval.test.ts` | Planned |
| **FR-QA-07** | Should | Delivery-time quality check comparison with initial grade | Buyer | Mobile Extension | `features/deliveries/DeliveryReceiptScreen.tsx` | `deliveryQuality.test.ts` | Planned |
| **FR-REQ-01** | Must | Buyer catalogue browse with filter (crop, grade, quantity, district, price, date) | Buyer | Mobile Extension | `features/buyer-catalogue/CatalogueScreen.tsx` | `catalogueFilter.test.ts` | Planned |
| **FR-REQ-02** | Must | Guided buyer request form (crop, min grade, quantity, price, location, date) | Buyer | Mobile Extension | `features/buyer-requests/CreateRequestScreen.tsx` | `buyerRequest.test.ts` | Planned |
| **FR-REQ-03** | Must | Admin pools verified lots into matched offer | Admin | Simulated Event | `services/mock/mockOfferService.ts` | `offerPooling.test.ts` | Planned |
| **FR-REQ-04** | Must | Buyer sees single consolidated proposal even with multi-supplier pool | Buyer | Mobile Extension | `features/offers/OfferDetailScreen.tsx` | `pooledOfferDisplay.test.ts` | Planned |
| **FR-REQ-05** | Must | Buyer accept, decline, counter offer; full negotiation timeline | Buyer | Mobile Extension | `features/offers/NegotiationTimeline.tsx` | `negotiation.test.ts` | Planned |
| **FR-REQ-06** | Must | Atomic stock reservation across all lots upon offer acceptance | All | Core Domain Rule | `domain/workflows/orderWorkflow.ts` | `atomicReservation.test.ts` | Planned |
| **FR-REQ-07** | Should | Direct lot reservation option | Buyer | Mobile Extension | `features/buyer-catalogue/LotDetailScreen.tsx` | `directReservation.test.ts` | Planned |
| **FR-REQ-09** | Must | Configurable request expiry notifications | Buyer | Mobile Extension | `services/mock/mockRequestService.ts` | `requestExpiry.test.ts` | Planned |
| **FR-ORD-01** | Must | Order creation with unique ID, buyer, allocations, terms | All | Core / Extension | `features/orders/OrderDetailScreen.tsx` | `orderCreation.test.ts` | Planned |
| **FR-ORD-02** | Must | Multi-supplier allocations consolidated into single buyer order | All | Core / Extension | `domain/models/Order.ts` | `multiAllocation.test.ts` | Planned |
| **FR-ORD-03** | Must | Order statuses: Created, Confirmed, Payment Pending, Paid, Dispatched, Delivered, Accepted, Settled, Cancelled, Disputed | All | Core / Extension | `domain/enums/OrderStatus.ts`, `orderWorkflow.ts` | `orderWorkflow.test.ts` | Planned |
| **FR-ORD-04** | Must | Supplier confirms or declines their specific allocation with reason | Supplier | Core | `features/orders/SupplierAllocationModal.tsx` | `supplierConfirm.test.ts` | Planned |
| **FR-ORD-05** | Must | Electronic terms acceptance with timestamp and user ID | Buyer, Supplier | Core / Extension | `features/orders/TermsAcceptanceModal.tsx` | `termsAcceptance.test.ts` | Planned |
| **FR-ORD-06** | Must | Configurable Cargo fee (commission + inspection) calculated and disclosed | All | Core / Extension | `domain/calculations/feeCalculator.ts` | `feeCalc.test.ts` | Planned |
| **FR-ORD-07** | Must | Order cancellation rules with automated stock release | All | Core / Extension | `domain/workflows/orderWorkflow.ts` | `orderCancelRelease.test.ts` | Planned |
| **FR-PAY-01** | Must | Payment confirmation strictly required before dispatch | All | Core Invariant | `domain/workflows/orderWorkflow.ts` | `dispatchPaymentGate.test.ts` | Planned |
| **FR-PAY-02** | Must | Mobile money / bank transfer instructions & simulated handoff | Buyer | Mobile Extension | `features/payments/PaymentInstructionsScreen.tsx` | `mockPayment.test.ts` | Planned |
| **FR-PAY-03** | Must | Payment status update with reference and validator identity | All | Core / Extension | `services/mock/mockPaymentService.ts` | `paymentConfirmation.test.ts` | Planned |
| **FR-PAY-04** | Must | Settlement calculation: supplier share minus fees after delivery acceptance | Supplier | Core | `domain/calculations/settlementCalculator.ts` | `settlementCalc.test.ts` | Planned |
| **FR-PAY-05** | Must | Supplier payout record with destination number, status, reference | Supplier | Core | `features/settlements/PayoutDetailScreen.tsx` | `payoutRecord.test.ts` | Planned |
| **FR-PAY-06** | Must | No card numbers or mobile money PINs stored on device | All | Security Baseline | Security Audit Checklist | `security.test.ts` | Planned |
| **FR-PAY-09** | Must | Append-only immutable financial transaction ledger | All | Core Ledger | `domain/models/LedgerEntry.ts` | `ledgerImmutability.test.ts` | Planned |
| **FR-DEL-01** | Must | Trip recording: transporter name, vehicle, driver, pickup, dates, quantity | All | Core / Extension | `features/deliveries/TripDetailsView.tsx` | `tripDetails.test.ts` | Planned |
| **FR-DEL-02** | Must | Loading confirmation with quantity and timestamp | All | Core / Extension | `domain/workflows/deliveryWorkflow.ts` | `loadingConfirmation.test.ts` | Planned |
| **FR-DEL-03** | Must | Buyer delivery receipt: received quantity, quality, and photo evidence | Buyer | Mobile Extension | `features/deliveries/DeliveryReceiptScreen.tsx` | `deliveryReceipt.test.ts` | Planned |
| **FR-DEL-04** | Must | Tolerance check: accept, accept with adjustment, or open dispute | Buyer | Mobile Extension | `domain/calculations/toleranceCalculator.ts` | `toleranceCheck.test.ts` | Planned |
| **FR-DEL-05** | Must | Buyer acceptance triggers settlement eligibility; display expected payout | Supplier | Core | `domain/workflows/settlementWorkflow.ts` | `settlementTrigger.test.ts` | Planned |
| **FR-INV-01** | Must | Invoice record per order: buyer, allocations, crop, grade, qty, fees, total | All | Core / Extension | `features/invoices/InvoiceViewScreen.tsx` | `invoiceGeneration.test.ts` | Planned |
| **FR-INV-02** | Must | External EBM invoice number and receipt copy reference stored | All | Core / Extension | `features/invoices/InvoiceViewScreen.tsx` | `ebmRecord.test.ts` | Planned |
| **FR-INV-03** | Must | Downloadable/previewable mock PDF order summary, delivery note, invoice | All | Core / Extension | `features/invoices/pdfGenerator.ts` | `pdfMock.test.ts` | Planned |
| **FR-INV-04** | Must | Full traceable audit trade record per order | All | Core / Extension | `features/orders/TradeAuditTimeline.tsx` | `auditTrace.test.ts` | Planned |
| **FR-DSP-01** | Must | Open dispute with reason, description, and photo evidence | Buyer, Supplier | Core / Extension | `features/disputes/CreateDisputeScreen.tsx` | `disputeCreation.test.ts` | Planned |
| **FR-DSP-02** | Must | Opening dispute pauses settlement on affected order | All | Core Invariant | `domain/workflows/disputeWorkflow.ts` | `disputeHold.test.ts` | Planned |
| **FR-DSP-03** | Must | Admin reviews dispute evidence and decides outcome | Admin, All | Simulated Event | `services/mock/mockDisputeService.ts` | `disputeResolution.test.ts` | Planned |
| **FR-DSP-04** | Must | Parties notified of dispute decision with recorded reasons | All | Core / Extension | `features/disputes/DisputeDetailScreen.tsx` | `disputeNotify.test.ts` | Planned |
| **FR-NTF-01** | Must | Notifications for all key trade events | All | Core / Extension | `features/notifications/NotificationInboxScreen.tsx` | `notificationEvents.test.ts` | Planned |
| **FR-NTF-02** | Must | In-app inbox and notification state with deep linking | All | Core / Extension | `features/notifications/NotificationItem.tsx` | `notificationDeepLink.test.ts` | Planned |
| **FR-NTF-05** | Must | Notification templates in Kinyarwanda and English | All | Core / Extension | `i18n/translations/` | `i18nNotifications.test.ts` | Planned |
| **UI-01** | Must | Touch targets >=44-48dp, clean typography, 360x640dp compatibility | All | UX Standard | `theme/tokens.ts`, UI Components | Visual & Lint Check | Planned |
| **UI-02** | Must | Kinyarwanda default for supplier/agent; English supported | All | UX Standard | `i18n/index.ts` | `i18n.test.ts` | Planned |
| **UI-04** | Must | Consistent badge colors and status text across all screens | All | UX Standard | `components/ui/StatusBadge.tsx` | Component Test | Planned |
| **UI-05** | Must | Real-time form validation with helpful plain language errors | All | UX Standard | `components/forms/FormField.tsx` | Form Validation Test | Planned |
| **UI-06** | Must | Photo compression on phone before upload (<1 MB) | Supplier, Agent | Core Native | `utils/imageCompression.ts` | `compression.test.ts` | Planned |
| **NFR-OFF-01** | Must | Field agent offline grading and visit recording | Agent | Core Native | `features/offline-queue/offlineQueueService.ts` | `offlineQueue.test.ts` | Planned |
| **NFR-OFF-03** | Must | Automatic sync when reconnected with visible honest status; server authority | All | Core Native | `features/offline-queue/SyncStatusBanner.tsx` | `syncIdempotency.test.ts` | Planned |
| **NFR-PRV-03** | Must | Buyer and supplier contact privacy projection (no mutual phone/exact GPS) | All | Core Privacy | `domain/projections/buyerProjections.ts` | `privacyProjection.test.ts` | Planned |
| **BR-01** | Must | Lot declaration only after harvest confirmation | Supplier | Business Invariant | `domain/workflows/lotWorkflow.ts` | `lotHarvestRule.test.ts` | Planned |
| **BR-02** | Must | Buyer visibility only after inspection grading AND admin approval | Buyer | Business Invariant | `domain/workflows/lotWorkflow.ts` | `buyerVisibility.test.ts` | Planned |
| **BR-03** | Must | Payment confirmation strictly required before dispatch | All | Business Invariant | `domain/workflows/orderWorkflow.ts` | `dispatchPaymentGate.test.ts` | Planned |
| **BR-04** | Must | Payouts eligible only after delivery acceptance or resolved dispute | Supplier | Business Invariant | `domain/workflows/settlementWorkflow.ts` | `settlementTrigger.test.ts` | Planned |
| **BR-05** | Must | Anonymized marketplace cards; direct contact withheld | Buyer | Business Invariant | `domain/projections/buyerProjections.ts` | `privacyProjection.test.ts` | Planned |
| **BR-07** | Must | Append-only grading records and ledger; corrections as new entries | All | Business Invariant | `domain/models/LedgerEntry.ts` | `ledgerImmutability.test.ts` | Planned |
