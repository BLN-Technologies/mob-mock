# CARGO — MASTER MOBILE APPLICATION BUILD PROMPT
## Product vision, SRS, architecture, UX/UI, implementation, testing, security, and Android release readiness
**Version:** 2.0 — Consolidated working master prompt  
**Project:** Cargo V1 Mobile  
**Platform:** Android first, React Native + TypeScript + Expo  
**Backend status:** Not integrated yet; use honest, replaceable local mock services  
**Source of truth:** Cargo V1 Software Requirements Specification (SRS), Version 1.0, October 2026, and Cargo V1 Module Guide, October 2026

---

# HOW TO FOLLOW THIS PROMPT

You are the mobile engineering team building Cargo from a brand-new repository. Work like a careful team member who explains things in simple language, checks their work, and does not pretend something works when it does not.

**Build the real application, not a pile of pictures.** Buttons must work, forms must validate, saved work must remain saved, navigation must make sense, and important business rules must be enforced in the service/domain layer—not only by hiding buttons.

Start by inspecting the environment and project directory. Then build, run, test, and improve the app in small steps. Do not stop after writing a plan or producing attractive screens.

Use the supplied Cargo SRS and Module Guide as the product authority. Read them before coding. Create a traceability table connecting every in-scope mobile requirement to its screen, service, test, and completion status. If a requirement is unclear or the documents conflict, record the question and choose the safest reversible implementation. Do not silently invent business policy.

Explain technical decisions in plain English. Keep explanations short and understandable, but keep the code professional.

# 1. THE TEAM AND ITS RESPONSIBILITY

Act as one coordinated team containing:
- Product-minded mobile architect.
- Senior React Native and TypeScript engineer.
- UI/UX designer for low-cost Android devices.
- Agricultural marketplace domain specialist.
- Offline-first and local-data engineer.
- Security and privacy engineer.
- Accessibility and localization specialist.
- QA automation engineer.
- Android release and DevOps engineer.

Own the full mobile delivery process: discovery, requirements, architecture, implementation, validation, documentation, and release preparation.

Do not claim that the app is production-ready, secure, integrated, or published unless the relevant checks and real integrations have actually been completed.

# 2. CARGO: THE STARTUP, MISSION, AND VISION

Cargo is a Rwandan agricultural technology startup building a trusted, digitally managed marketplace that connects cooperatives and organized farm groups with institutional bulk buyers.

**Mission:** Make agricultural trade in Rwanda more trustworthy, accessible, efficient, and transparent by connecting verified agricultural supply with institutional demand through technology and accountable field operations.

**Vision:** Become a trusted digital infrastructure layer for agricultural commerce in Rwanda, helping institutions source quality produce and helping organized suppliers reach dependable markets.

Cargo is not an unrestricted peer-to-peer shop. It is a managed marketplace. Software and Cargo staff work together to verify organizations, confirm harvest-ready supply, inspect and grade produce, coordinate offers and pooled orders, confirm payment, record delivery, handle disputes, and create traceable trade records.

The mobile experience must work for real people who may have limited technical experience, inexpensive Android phones, small screens, limited storage, and unreliable mobile data.

Cargo's core promise is trust. Never show an unverified lot as verified. Never call a request, payment, inspection, delivery, or settlement successful unless the applicable state transition really occurred. Never present mock data as a real trade.

# 3. SOURCE OF TRUTH, SCOPE, AND CONFLICT RULES

## 3.1 Required documents
Read and use:
1. `Cargo V1 Software Requirements Specification (SRS)`, Version 1.0, October 2026.
2. `Cargo V1 module guide`.
3. This master prompt.
4. Any later, explicitly approved written product decisions.

Create `docs/requirements-traceability.md`, `docs/assumptions-and-decisions.md`, and `docs/mobile-scope.md`.

## 3.2 Scope authority
The SRS defines Cargo V1 as three connected parts: Android-first mobile for cooperative leaders and field agents, a web application for buyers and Cargo administrators, and a shared backend. The SRS also says buyers can use a mobile web browser. Therefore:

- Supplier and field-agent native mobile workflows are mandatory core scope.
- This prompt additionally asks for a buyer experience in the native mobile app. Implement it as a **clearly documented mobile extension/demo scope** that uses the same domain rules and service contracts, without replacing the buyer web app.
- Administrators primarily use the separate web app. Do not build a full admin console inside the mobile app. A mobile user who signs in as an administrator must see a clear, safe web handoff or unsupported-role message.
- Transporters are not V1 system users. Do not build a transporter portal.
- The native release is Android first. iOS is outside Cargo V1.
- The first backend integration is future work. The mock app must be useful and testable now, but must not pretend it has a live backend.

If this prompt requests a visual or optional feature that conflicts with a mandatory SRS business rule, the SRS business rule wins. Do not silently widen V1.

## 3.3 V1 must-have business scope
The wider Cargo platform includes:
- Authentication, roles, registration review, organization profiles and verification.
- Harvest-ready lot declarations and unique lot codes.
- Field visits, quality grading, evidence capture, offline inspection, and administrator verification.
- Buyer catalogue browsing and filtering, buyer requests, offers, counteroffers, and administrator-assisted pooling.
- Orders with one or multiple supplier allocations.
- Payment confirmation before dispatch.
- Delivery recording, buyer receipt and acceptance, disputes, and settlement holds.
- Invoice/trade records and downloadable order/delivery/invoice documents.
- In-app notifications and notification state.
- Localized Kinyarwanda and English interfaces.
- Privacy, audit-friendly records, and administrative controls in the web/backend parts.

The mobile app implements the workflows needed by its mobile roles and the explicitly requested buyer extension. It must not duplicate every web administrator capability.

## 3.4 Out of scope for V1
Do not build these as real V1 capabilities:
- Direct EBM/RRA integration. Store invoice details and a document reference entered through the approved process; do not claim the app issues official EBM invoices itself.
- USSD.
- Native iOS release.
- A transporter account/app.
- Automated pooling or autonomous trading algorithms; V1 matching is human-assisted.
- Buyer credit terms such as Net-15/Net-60.
- Cold-chain temperature tracking.
- Sale of data products.
- Any payment holding, lending, or money-transfer service operated by Cargo itself outside a licensed payment partner.
- Fake SMS, push delivery, payment provider, maps, or server sync.

Optional SRS items marked “Should” or “Could” must not delay Must requirements. Record optional work and implement it only after the core flow is stable.

# 4. USERS, ROLES, AND ACCESS

Use these four domain roles:
1. **Supplier** — a cooperative, cooperative leader, or organized farm group representative.
2. **Field agent** — a Cargo-appointed worker who performs supplier visits and lot inspections.
3. **Buyer** — an institution sourcing produce in bulk. Buyer native-mobile screens are an added extension in this prompt; the buyer web app remains part of the overall product.
4. **Administrator** — Cargo staff who approve accounts, verify lots, create pooled offers, manage exceptions, confirm manual payment where allowed, record trips, resolve disputes, and manage settings through the web product.

Never show a role picker as the normal login destination mechanism. The mock authentication service returns the role and account status; the app routes accordingly. Provide documented demo accounts for each mobile-supported role. Agent accounts are provisioned by administrators, not freely self-registered.

Use a central role/permission map and enforce it in domain/service methods as well as navigation. Hiding a button is not access control. Every screen must handle unauthorized access safely.

# 5. BUYER MOBILE CAPABILITIES — ADDED NATIVE-MOBILE EXPERIENCE

Build a polished buyer journey that uses the same domain models and rules as the SRS buyer web experience.

## 5.1 Buyer onboarding and organization
- Sign in, restore session, sign out, and complete simulated first-device OTP verification.
- View buyer organization details and verification/approval status.
- Submit or update allowed organization profile fields in the mock flow.
- Show clear pending, approved, rejected, and suspended states.
- Explain why a buyer cannot transact while pending or suspended.
- Keep tax and registration details private and role-restricted.
- Never allow a buyer to bypass approval by editing local state.

## 5.2 Discover verified produce
- Browse only lots that are both field-graded and administrator-verified.
- Search and filter by crop, variety where supported, grade, available quantity, district, price expectation, and availability date.
- Show a clear lot code, crop, grade, available quantity, unit, price expectation, general permitted location, availability date, photos, and verification timeline.
- Show quality details in understandable language.
- Show an honest empty state if there are no matching lots.
- Do not reveal supplier name, phone, exact private location, personal contacts, or hidden supplier metadata by default.
- Do not make up certification, endorsements, freshness claims, or quality grades.

## 5.3 Post a buyer request
Provide a guided request form with:
- Crop and variety if relevant.
- Minimum acceptable grade.
- Required quantity and unit.
- Target price or price preference if supplied.
- Delivery location.
- Required delivery date.
- Notes and confirmation.
- Draft saving, validation, review, submit confirmation, request status, expiry, and relevant notifications.

Use sensible defaults only when the business has approved them. Do not invent grade thresholds, fees, or expiry rules. Read configurable values from the mock catalogue/settings service when available.

## 5.4 Offers and negotiation
- View an offer as one clear proposal, even when it combines lots from several suppliers.
- Show total quantity, grade information, price per unit, total price, delivery date, supplier count, fee details when applicable, and terms.
- Allow the buyer to accept, decline, or counter an offer when the offer state allows it.
- Display the complete negotiation timeline and the latest state.
- Confirm consequential actions before applying them.
- On acceptance, call a domain operation that validates and reserves all required quantities together. If any allocation is no longer available, fail safely and explain that the offer needs review. Never partially reserve stock by accident.
- Do not claim the offer is accepted or stock is reserved while offline or if the operation fails.

## 5.5 Orders and payment status
- Show order list, filters, order details, supplier-allocation summary without exposing private contacts, agreed quantity and grade, unit price, fees, total, delivery terms, terms acceptance, timeline, and current next action.
- Let the buyer review and explicitly accept the order terms.
- Show clear payment instructions or simulated payment-partner handoff.
- In mock mode, payment actions must be labeled “Demo payment” or “Simulated payment”; never collect real PINs, card data, or mobile-money credentials.
- Only a verified mock payment confirmation can transition an order to Paid.
- Paid status is required before dispatch. A button tap alone is not payment confirmation.
- Clearly distinguish payment pending, payment confirmed, failed, under reconciliation, refunded/adjusted if supported, and disputed states.

## 5.6 Delivery, receipt, and acceptance
- Show expected delivery date and available delivery timeline.
- Let the buyer record received quantity and, where supported, received quality.
- Let the buyer attach photos when reporting a problem, with permission and file-size handling.
- If quantity or quality differs beyond configured tolerance, offer the SRS-approved choices: accept, accept with adjustment, or open a dispute.
- Do not automatically accept delivery because time passed. Unanswered deliveries should be flagged for administrative follow-up when that optional behavior is implemented.
- Acceptance triggers settlement eligibility in the domain workflow, but must not imply that real funds have already been transferred.

## 5.7 Disputes, documents, and notifications
- Open a dispute against an eligible order with a reason, description, and evidence.
- Show the dispute timeline, evidence, status, administrator decision, and outcome when available.
- Make it clear that the affected settlement amount is on hold while the dispute is open.
- Show downloadable or previewable mock PDF order summaries, delivery notes, and invoice details when generated locally; label mock documents as demo records.
- Display EBM invoice/receipt details only when present in the record. Do not claim direct EBM integration.
- Provide an in-app notification inbox, unread/read state, useful deep links into the relevant record, and localized message content.

# 6. SUPPLIER MOBILE CAPABILITIES

## 6.1 Supplier registration and organization
- Registration request and sign-in.
- Organization profile fields from the SRS: cooperative name, registration number, district and sector, contact person, phone, crops grown, and approximate capacity.
- View pending, verified, suspended, rejected, and action-required states where relevant.
- View permitted visit/verification status and any feedback.
- Only verified suppliers may create a lot submission. If pending, explain the next step rather than showing a broken form.
- Respect privacy and avoid displaying sensitive profile details unnecessarily.

## 6.2 Supplier dashboard
Build a useful dashboard derived from actual local records:
- Active lots.
- Pending inspections.
- Lots needing correction or action.
- Verified available stock.
- Orders needing supplier confirmation.
- Orders in progress.
- Payout/settlement status summaries.
- Recent activity and notifications.

Do not use hardcoded numbers that disagree with the underlying demo records.

## 6.3 Harvest-lot lifecycle
Build a guided, resumable lot declaration flow containing:
- Crop and variety.
- Harvest date and confirmation that harvest has occurred.
- Quantity, unit, remaining quantity, and price expectation.
- Availability date.
- Pickup/general location.
- Packaging or storage information when required by the configured crop template.
- At least one photo.
- Inspection availability and notes where relevant.
- Review screen and explicit submission confirmation.

Support draft save, edit draft, resume, field validation, photo selection/capture, compression, submit, success/error feedback, and status timeline. Use unique deterministic demo lot codes.

Use the SRS statuses exactly and consistently: Draft, Submitted, Verified, Reserved, Sold, Rejected, Withdrawn, Expired. Where partial reservations/sales are represented, show remaining quantity separately from original quantity. A supplier may edit or withdraw before verification; after verification, quantity or price changes must use an approval-request flow and be recorded.

A lot is buyer-visible only after field grading and administrator verification. Do not allow future, unharvested produce to become available verified stock. Never silently edit a submitted grading record.

## 6.4 Supplier orders and settlement
- Show order allocation details relevant to the supplier.
- Let the supplier confirm or decline their allocation when permitted by order state.
- If unable to supply, capture a reason and notify the mock admin workflow.
- Show accepted terms and confirmation timestamp.
- Show payment confirmation, dispatch, delivery, buyer acceptance, dispute, and settlement progress.
- Display payout expected/status/reference only when present in the record.
- Do not show a payout as completed merely because the buyer accepted delivery.
- Keep the affected amount on hold while a dispute remains unresolved.
- Show trade history and available order/invoice/delivery records.

## 6.5 Supplier offline support
Allow the supplier to prepare a lot draft offline when possible. Clearly distinguish local draft from a server-submitted lot. Do not show it as submitted, verified, reserved, or buyer-visible until the server/mock sync operation confirms the transition.

# 7. FIELD-AGENT MOBILE CAPABILITIES

## 7.1 Assigned work
- Sign in with an administrator-provisioned account.
- Show assigned supplier visits and inspection tasks with priority, location description, due date if available, and current status.
- Open task details and relevant lot/organization information.
- Separate supplier verification visits from lot grading tasks.
- Show no-task, loading, error, and offline states.
- Never invent an assignment if no task exists.

## 7.2 Supplier verification visit
Where assigned, capture visit notes, relevant photos, GPS location only with permission, and timestamp. Explain why location is requested. If permission is denied, let the agent proceed with the permitted manual alternative and mark the missing location clearly; never fabricate coordinates.

## 7.3 Lot inspection and grading
Use crop-specific grading templates and administrator-configured rules from mock catalogue/settings data. Do not invent universal agricultural thresholds.

Capture:
- Required measurements for the configured crop, such as moisture percentage, foreign matter, damaged/defective share, size/count, or other approved fields.
- Typed readings from external scales/meters; do not claim the app reads hardware automatically.
- Quality checklist and notes.
- Required photo evidence.
- GPS location with permission and timestamp.
- Calculated/proposed grade and explanation based on the configured rules.
- Review screen before submission.

Validate ranges and required evidence. Make numeric inputs easy to use outdoors. Submitted grading records are immutable; corrections create a new dated record linked to the original. The agent can see the grade result before submission. Submission is not the same as administrator approval.

## 7.4 Offline-first agent workflow
This is a Must requirement. Implement real local persistence and a persistent action queue, not a decorative offline badge.

An agent must be able to:
1. Open a task already available on the device.
2. Enter allowed visit or grading information without a connection.
3. Save a draft locally.
4. Close and reopen the app and recover the draft.
5. Submit the completed record to a persistent local queue.
6. See each queued item and its state.
7. Retry failed work safely.
8. Simulate or detect connectivity returning.
9. Synchronize through the mock adapter and see an honest result.
10. Retry without duplicate grading records or duplicate submissions.

Use distinct states: Local draft, Queued, Syncing, Synced in demo mode, Failed, and Needs attention. The local queue must store stable operation IDs, timestamps, retry/error metadata, and payload version. Implement idempotency/deduplication in the mock sync service. Do not delete a queued record until the simulated server accepts it. Never overwrite newer server state silently.

When the backend is integrated, the server remains authoritative for statuses, payments, permissions, and final business decisions. Detect conflicts and ask for review rather than silently replacing data.

## 7.5 Buyer offline behavior
Buyers may view clearly labeled cached catalogue data and save request drafts offline. They may draft a response or form locally where safe. Do not allow offline operations to claim that stock was reserved, an offer accepted, payment confirmed, order confirmed, delivery accepted, or settlement completed. Those transitions require a successful authoritative service operation. Show “Waiting for connection” or “Saved on this device” and explain what remains to be done.

# 8. COMPLETE TRADE FLOW AND DOMAIN RULES

The app must represent the full Cargo lifecycle, even when some administrative steps are demonstrated through seeded mock events:

1. Supplier and buyer registration submitted and reviewed.
2. Supplier becomes verified.
3. Supplier declares already-harvested stock.
4. Field agent performs visit/inspection and submits grading.
5. Administrator approves or rejects the graded lot.
6. Only verified stock appears in buyer catalogue.
7. Buyer browses or posts a request.
8. Cargo administrator creates a human-assisted offer, including pooling if needed.
9. Buyer accepts, declines, or counters the offer.
10. Acceptance atomically reserves all matching lot quantities.
11. Order is created with unique order number and supplier allocations.
12. Suppliers confirm their allocations; terms acceptance is recorded with who/when.
13. Buyer payment is confirmed by the mock partner adapter or an authorized manual confirmation flow.
14. Goods are marked dispatched only after payment confirmation.
15. Loading and delivery details are recorded by the appropriate operations flow.
16. Buyer records quantity/quality received and accepts, accepts with adjustment, or opens a dispute.
17. Eligible supplier settlement is calculated and prepared after acceptance or approved dispute resolution.
18. Invoices, EBM reference details, trade records, notifications, and audit-style events are retained.
19. A dispute pauses settlement of the affected amount until an authorized decision is recorded.

Use separate states for lot, inspection, request, offer, order, payment, delivery, payout, dispute, and synchronization. Do not overload one generic `status` field for unrelated processes.

Centralize state transitions in typed domain/service functions. Reject invalid transitions with clear, localized messages. Keep append-only timelines for important decisions. Corrections create new records or events; do not rewrite immutable grading and financial records.

Use whole Rwandan francs (RWF) for money, stored as integer amounts, and kilograms as the canonical quantity unit internally. Convert to tons for display only. Show dates as day/month/year and use Central Africa Time for presentation. Keep calculations deterministic and tested.

# 9. PROJECT SETUP FROM A BRAND-NEW REPOSITORY

Before making changes:
1. Confirm the exact project root and current directory.
2. Inspect the directory and protect unrelated work.
3. Check Node.js, package manager, Git, Expo-compatible environment, Android SDK/emulator/device availability, and operating system.
4. Check whether Git is already initialized in this exact project root.
5. Read the SRS and module guide.
6. Record environment facts and any missing prerequisites.
7. Do not initialize Git in a parent folder or overwrite an existing unrelated project.

Create a new Expo React Native project with TypeScript using a currently compatible stable Expo SDK. Use the Expo-recommended installation commands for native modules. Do not guess package versions or install overlapping libraries without a reason.

Configure:
- Strict TypeScript.
- Typed navigation.
- Linting and formatting.
- Unit/component testing.
- App configuration and environment conventions.
- Central theme and assets.
- Local persistence.
- Error handling and safe logs.
- Git ignore rules.
- Reproducible package installation and committed lockfile.
- README and engineering docs.

Launch the starter app before building feature screens. If Android tooling is unavailable, document the exact limitation and run all other checks possible. Never say an emulator build succeeded unless it was actually run.

# 10. ARCHITECTURE AND PROJECT ORGANIZATION

Use a feature-oriented, modular architecture. Adapt only when implementation evidence justifies it.

Suggested structure:

```text
src/
  app/
    bootstrap/
    navigation/
    providers/
  components/
    ui/
    forms/
    feedback/
    layout/
  features/
    auth/
    onboarding/
    organizations/
    supplier-dashboard/
    lots/
    buyer-catalogue/
    buyer-requests/
    offers/
    orders/
    inspections/
    deliveries/
    payments/
    settlements/
    disputes/
    invoices/
    notifications/
    profile/
    settings/
    offline-queue/
  domain/
    models/
    enums/
    permissions/
    validation/
    workflows/
    calculations/
  services/
    contracts/
    mock/
    api/
  data/
    repositories/
    local/
    migrations/
  theme/
  i18n/
  hooks/
  utils/
  assets/
docs/
tests/
```

Rules:
- Strict TypeScript; avoid `any` and unsafe type assertions.
- Domain types must not depend on React components.
- Screens must not import static mock arrays directly.
- Use typed repository/service contracts and separate mock adapters.
- Keep local persistence behind a repository interface.
- Keep session/auth state separate from business data.
- Centralize statuses, permissions, validation, fees, tolerances, and state transitions.
- Keep components focused, reusable, and testable.
- Use typed route parameters and deep-link handling.
- Use one coherent UI/styling approach; avoid competing UI libraries.
- Keep production API configuration separate from demo mode.
- Do not add empty folders or abstraction layers that have no purpose.

# 11. MOCK SERVICES AND FUTURE BACKEND INTEGRATION

The future backend plan is NestJS, PostgreSQL, and Prisma. Mobile must not depend on backend internals; it must depend on documented service contracts.

Create contracts and mock implementations for:
- Authentication and session.
- User and organization profile/verification.
- Crop catalogue and settings.
- Lots and inventory.
- Supplier visits and grading.
- Buyer requests.
- Offers and negotiation.
- Orders and supplier allocations.
- Payment status and payout visibility.
- Delivery and receipt/acceptance.
- Disputes.
- Invoice/trade records.
- Notifications.
- Local offline queue and synchronization.
- User preferences and reports summaries.

Mock calls should be asynchronous and predictable. Support loading, success, empty, validation errors, permission errors, retryable errors, and conflict states. Seed data must be deterministic and realistic.

Add an API adapter boundary for future documented JSON/HTTPS endpoints, but do not call nonexistent endpoints. Add no fake production credentials. Do not report the backend as integrated until a real environment, API contract, authentication, and end-to-end tests prove it.

Every service method should define its inputs, outputs, errors, and role requirements. Use DTOs at the service boundary and domain models internally where appropriate.

# 12. LOCAL DATA, SESSION, AND SYNC

Persist useful demo state across navigation and app restarts:
- Demo session state, using appropriate secure storage where supported.
- User preferences and language.
- Lot drafts and mock lot state.
- Inspection drafts and submitted local records.
- Offline queue and retry metadata.
- Buyer request drafts.
- Read/unread notification state.
- Demo workflow events.

Never persist real passwords, payment PINs, or production secrets. Demo OTPs must be clearly marked simulated and must not be mistaken for real security. Do not log credentials or tokens.

Provide a documented demo reset function with confirmation. Use stable IDs and deterministic seed data. Avoid resetting a user's work automatically on every launch.

# 13. PREMIUM MOBILE UI/UX DESIGN SYSTEM

Build a distinctive, polished, calm, trustworthy agricultural operations app. It must look intentionally designed—not like a generic dashboard template, a random collection of cards, or a screen generated only to look good in a screenshot.

## 13.1 Brand and visual direction
- Primary: deep forest green.
- Base: warm off-white and clean neutral surfaces.
- Text: charcoal with accessible contrast.
- Secondary: restrained agricultural earth tones.
- Amber: attention and field-task states.
- Other status colors only when their meaning is consistent and accessible.
- Professional vector icons; never use emoji as interface icons.
- Use a consistent font such as Inter if compatible and legally usable, with system fallback.
- Use high-quality, legally usable agricultural photography only where it adds value.
- Compress and resize images for low-data use.

Do not invent government endorsements, certification logos, customer testimonials, partner logos, or claims of verified success.

## 13.2 Design tokens and components
Create tokens for colors, typography, spacing, radii, borders, elevation, icon sizes, touch targets, and status colors. Build reusable components such as:
- Primary/secondary/destructive buttons.
- Text and numeric fields.
- Search and filter controls.
- Status badges with text plus color/icon.
- Lot, request, offer, order, task, and notification list items.
- Timelines and step indicators.
- Bottom sheets/dialogs.
- Empty, loading, error, offline, permission-denied, and success states.
- Skeleton loaders that match the real content layout.
- Toasts or inline feedback for completed actions.
- Photo evidence thumbnails and upload states.
- Offline sync queue row and conflict banner.
- Accessible confirmation dialogs.

Do not show skeletons indefinitely. Provide a timeout/error path. Do not use skeletons for every tiny action; use inline progress for a button operation.

## 13.3 Navigation
Design navigation around each role's real jobs:
- Supplier: Home, Lots, Orders, Activity/Notifications, Profile.
- Field agent: Tasks, Offline Queue, Activity, Profile.
- Buyer extension: Discover, Requests, Orders, Notifications, Profile.

Use a stable bottom tab bar for the main destinations and a typed stack for details and workflows. Keep tabs limited and meaningful. Use nested routes for multi-step forms. Provide clear back behavior, preserve safe draft progress, and avoid dead ends.

Do not put dashboards, portals, role selection, or login forms on the splash screen. Use a brief branded splash, then restore the session or show the correct authentication/onboarding route. Do not flash the wrong role's dashboard during session restoration.

## 13.4 Screen quality
Design for Android devices around 360 × 640 dp and inexpensive phones. Respect safe areas, status/navigation bars, keyboard appearance, font scaling, system back, and Android permission dialogs.

Requirements:
- No horizontal overflow or clipped text.
- Forms remain usable when the keyboard is open.
- Touch targets around 44–48 dp or larger where practical.
- Readable outdoors with strong contrast.
- Clear headings and one obvious primary action per screen.
- Short, plain-language instructions.
- Helpful inline validation.
- Intentional whitespace and alignment.
- Consistent content density.
- Fast transitions that respect reduced-motion preferences where possible.
- Useful empty states with a next action.
- Error states explain recovery.
- No decorative controls that do nothing.
- Do not use media-query-dependent web layout techniques in native React Native; use responsive flex layouts, dimensions, and platform-safe patterns.
- Do not use excessive gradients, shadows, glass effects, animated decoration, or giant hero sections that make operational tasks slow.

## 13.5 Skeletons, loading, and feedback
- Use screen-specific skeletons for catalogue lists, dashboards, orders, and tasks.
- Keep layout stable to reduce visual jumps.
- Use optimistic updates only when the operation is safely reversible and the service contract supports rollback.
- Never optimistically mark a payment, reservation, verification, delivery acceptance, or settlement as complete.
- Show progress for photo compression, local save, queue submission, and sync.
- Explain offline state with a persistent but unobtrusive indicator.
- Every error must give a useful next action where possible.

## 13.6 Accessibility
Use accessible labels, semantic roles, logical focus order, adequate contrast, scalable text, and screen-reader-friendly status messages. Do not communicate status by color alone. Test important flows with Android accessibility tools where available.

# 14. SPLASH, AUTHENTICATION, AND ACCOUNT STATES

## 14.1 Splash and app bootstrap
Create a short, polished Cargo splash screen with logo/wordmark and brand colors. No dashboard content, portals, forms, or unrelated cards. Bootstrap should check persisted session, app version/config, and demo mode safely, then route without showing the wrong role.

## 14.2 Authentication
Implement:
- Sign in with phone or email and password.
- Registration request for supplier and buyer.
- Agent login using provisioned demo account only.
- Forgot password and simulated OTP flow.
- First-login/new-device OTP demonstration.
- Session restoration and inactivity/session-expiry handling in the demo architecture.
- Sign out and clear session state.
- Pending approval, rejected, suspended, locked, and invalid-credentials states.
- Terms and privacy notice acknowledgement in the registration flow.

Clearly mark OTP as simulated. Do not send real SMS unless a real approved provider is integrated. Mock failed-login lockout behavior and test it. Do not store or log passwords in plaintext. Keep demo accounts documented in the README and make them impossible to confuse with production accounts.

# 15. LOCALIZATION AND RWANDA-SPECIFIC DETAILS

Implement complete Kinyarwanda and English translation dictionaries. Kinyarwanda is the default for supplier and field-agent experiences as specified by the SRS. Buyer language follows the user's saved preference; English may be the default for the buyer extension unless product owners approve otherwise.

Translate all user-visible strings, including:
- Navigation and buttons.
- Form labels and help.
- Validation and error messages.
- Lot, inspection, request, offer, order, payment, delivery, payout, dispute, and sync statuses.
- Notifications and empty states.
- Permission explanations.
- Demo labels and offline instructions.

Persist language selection and apply it immediately. No decorative toggle that leaves most screens untranslated. Use translations that are understandable and document phrases requiring review by a fluent Kinyarwanda speaker.

Use RWF whole-number currency, kg as canonical quantity and tons for display, and day/month/year date presentation in Central Africa Time. Avoid hardcoded date formats across screens.

# 16. SECURITY, PRIVACY, AND RESPONSIBLE DATA HANDLING

Security in the mobile app complements—but never replaces—server-side security.

- Enforce role permissions in service/domain methods and design equivalent future server authorization.
- Never rely on hiding a button as the only access control.
- Separate private supplier records from buyer-visible lot projections.
- Do not show buyer and supplier phone numbers to each other by default.
- Do not expose private coordinates or personal contacts in marketplace cards.
- Ask for camera, media, and location permission only when needed and explain why.
- Handle permission denial without crashing or fabricating evidence.
- Restrict photo/file types and sizes, compress before upload, and never execute uploaded files.
- Do not store payment PINs, card numbers, or production secrets.
- Use secure session storage appropriate to the platform.
- Avoid sensitive information in logs, crash messages, screenshots, and analytics.
- Use HTTPS for any real API.
- Validate all inputs and service responses.
- Avoid leaking private details in navigation params or notifications.
- Make sensitive actions require confirmation.
- Support privacy policy and terms entry points.
- Document data retention and deletion/correction request handoff for later backend implementation.
- Never claim legal compliance merely because a policy screen exists.

# 17. ERROR HANDLING AND RESILIENCE

Every major screen and service must handle:
- Loading.
- Empty data.
- Validation errors.
- Service failure.
- No connection.
- Expired session.
- Unauthorized role.
- Permission denied.
- Photo/camera failure.
- Local storage failure.
- Sync conflict.
- Duplicate submission.
- Stale inventory or offer.
- Failed payment simulation.
- Dispute hold.
- Unexpected application error.

Use one consistent error model and safe user-facing messages. Log useful technical context without credentials or personal secrets. Provide retry only when retry is safe. For non-idempotent actions, use operation IDs and server/mock idempotency to prevent duplicates.

# 18. TESTING AND QUALITY GATES

Write tests as features are built, not at the very end.

## 18.1 Unit/domain tests
Test:
- Role and permission decisions.
- Registration/account state handling.
- Lot field validation and harvest-ready rule.
- Lot visibility only after grading plus administrator verification.
- Quantity and partial reservation calculations.
- Offer accept/decline/counter transitions.
- Atomic reservation across pooled lots.
- Order status transitions.
- Payment-confirmation-before-dispatch.
- Fee and payout calculations using whole RWF.
- Buyer acceptance and dispute settlement holds.
- Immutable grading/ledger history behavior.
- Local queue retry and duplicate prevention.
- Server-wins conflict behavior.
- Buyer privacy projection.
- Localization fallback and required-key completeness.
- Request and lot expiry logic if implemented.

## 18.2 Component and navigation tests
Test:
- Correct role-based landing route.
- No wrong-role dashboard flash during bootstrap.
- Forms, inline validation, keyboard-safe layout.
- Empty/loading/error/offline states.
- Confirmation dialogs.
- Notification deep links.
- Language switching.
- Session expiry and logout.
- Navigation back behavior and draft restoration.

## 18.3 Integration and end-to-end journeys
At minimum, demonstrate and test:
1. Supplier signs in, completes profile, and sees pending/verified status.
2. Verified supplier creates a lot draft, adds a photo, and submits it.
3. Agent opens assigned task, enters measurements/evidence, saves offline, restarts app, and recovers work.
4. Agent queues and retries sync without duplicates.
5. Admin approval is represented honestly; only then does the lot become buyer-visible.
6. Buyer filters verified stock and posts a request.
7. Buyer views a pooled offer, counters/accepts it, and inventory is reserved atomically.
8. Order terms and supplier allocation confirmations are recorded.
9. Mock payment is confirmed before dispatch.
10. Buyer records delivery receipt and accepts or opens a dispute.
11. A dispute holds affected settlement until an authorized resolution.
12. Supplier sees payout status and trade documents.
13. Privacy tests prove private supplier details are absent from buyer projections.
14. App restart preserves relevant demo state.
15. Logout clears the active session and returns to authentication.

## 18.4 Required checks
Run the checks supported by the repository, such as:
- TypeScript type check.
- Linter.
- Formatter check.
- Unit tests.
- Component tests.
- Android development build or emulator/device smoke test.
- Accessibility review.
- Dependency/security audit where available.
- Small-screen visual review.
- Performance checks for image size, screen loading, and large lists.

Record the exact command and real result. If a command cannot run, report why and what remains unverified. Do not suppress failures or disable lint/type checks just to get a green result.

# 19. PERFORMANCE AND LOW-CONNECTIVITY TARGETS

Use the SRS as the target:
- Mobile screens should open within about 2 seconds from stored data.
- Support inexpensive Android 8.0+ devices where compatible with the chosen Expo SDK and dependency support.
- Keep images compressed, ideally around 1 MB or less per photo as specified by the SRS.
- Avoid large unnecessary downloads.
- Keep lists efficient and paginate or virtualize when needed.
- Avoid expensive rerenders and long startup tasks.
- Preserve local drafts through app restarts.
- Make sync visible and retryable.
- Avoid background behavior that drains battery or data.
- Respect limited storage and provide a graceful message when storage is insufficient.

Measure rather than guess. If the development environment cannot verify a target, document it as unverified.

# 20. GIT, COMMITS, AND TEAM DELIVERY

Initialize Git only in the intended mobile project root if needed. Use a suitable `.gitignore`. Never commit secrets, local databases containing sensitive data, signing keys, or irrelevant build outputs.

Use small, reviewable Conventional Commits, for example:
- `chore(mobile): initialize Expo TypeScript foundation`
- `chore(tooling): configure linting and tests`
- `feat(ui): establish Cargo mobile design system`
- `feat(auth): add role-aware demo authentication`
- `feat(supplier): implement harvest lot workflow`
- `feat(agent): add offline inspection workflow`
- `feat(buyer): add catalogue and request journeys`
- `feat(offers): implement negotiation and reservation rules`
- `feat(trades): add order and delivery tracking`
- `feat(i18n): add Kinyarwanda and English`
- `test(mobile): cover critical business rules`
- `docs(mobile): document setup and demo journeys`

Before each commit: inspect status and diff, run relevant checks, scan for secrets, exclude unrelated files, and commit a coherent unit. Never create empty commits, invent hashes, rewrite history, force-push, or push without permission. If Git identity is missing, report it and request configuration rather than inventing authorship.

# 21. DOCUMENTATION AND REQUIRED PROJECT ARTIFACTS

Maintain:
- `README.md` — setup, run, test, demo accounts, reset instructions, known limitations.
- `docs/mobile-scope.md` — mandatory SRS scope vs buyer mobile extension vs excluded work.
- `docs/requirements-traceability.md` — requirement ID, role, screen/service, test, status, evidence.
- `docs/assumptions-and-decisions.md` — questions, chosen defaults, rationale, date, approval needed.
- `docs/architecture.md` — module boundaries, navigation, state, storage, mock/API adapters.
- `docs/domain-workflows.md` — statuses, transitions, invariants, and invalid transitions.
- `docs/offline-sync.md` — local queue, idempotency, retry, conflict resolution, server authority.
- `docs/security-privacy.md` — permissions, sensitive data, role boundaries, limitations.
- `docs/localization.md` — translation process and language coverage.
- `docs/testing.md` — test commands, test accounts, test scenarios and results.
- `docs/release-checklist.md` — Android build, privacy, signing, store listing, and handover.
- `docs/demo-guide.md` — exact steps for supplier, agent, and buyer demonstration journeys.
- `.env.example` only for non-secret configuration names; no real keys.

# 22. ANDROID STORE RELEASE READINESS

Prepare the app for a real Android release, but distinguish “release-ready code” from actually publishing to a store. Publishing requires owner credentials, signing configuration, legal policies, approved assets, and final human approval.

## 22.1 App identity and build
- Set a stable application name and unique Android application ID only after confirming the intended values.
- Configure version name/code and an explicit release process.
- Use Expo EAS or another compatible documented build process if appropriate.
- Keep production signing credentials and service secrets outside Git.
- Produce reproducible development and release builds.
- Test a release-like build on a real supported Android device where available.
- Verify Android back behavior, keyboard, permissions, app resume, and session restoration.
- Check offline behavior after force-close/relaunch.
- Remove development-only screens, debug controls, and mock demo accounts from production configuration, or make the app visibly and safely demo-only until a production backend exists.
- Do not ship a mock-only app to the public store as if it supports real trading. A mock build can be used for internal demonstrations; public release requires approved production behavior or an explicit demo positioning decision.

## 22.2 Privacy, policy, and store assets
Prepare a checklist for:
- Public privacy policy URL and contact route.
- Terms of service.
- Accurate data-safety declarations based on actual SDKs and behavior.
- Permission explanations for camera, photos, and location.
- Account deletion/correction request path as required by applicable store policies and the actual account model.
- Content rating and target audience.
- App icon, splash, screenshots, store description, and support contact.
- Copyright/license review for fonts, icons, photos, and third-party assets.
- Crash reporting and analytics disclosure if used.
- Data retention, backup, and account suspension behavior.
- Security review and dependency review.
- Store review credentials/instructions only if required and safely provided.

Never invent a privacy policy URL, support address, business registration, certification, partner agreement, or legal compliance statement. Mark missing owner-provided information as a release blocker.

## 22.3 Release validation
Before release, verify:
- Clean install and upgrade behavior.
- No crashes in core journeys.
- No debug credentials or secrets in the package.
- No broken or fake payment flows.
- Correct role permissions and privacy projections.
- Accessible text and touch targets.
- Kinyarwanda and English coverage.
- Offline queue recovery and duplicate protection.
- Clear network errors and retry behavior.
- Store policy and privacy checklist reviewed by the owner.
- Production backend and external providers are real, configured, and tested—or the build is explicitly labeled internal/demo and not presented as a production marketplace.

# 23. IMPLEMENTATION PHASES AND EXIT CRITERIA

Build in dependency order. Do not jump to elaborate screens before the foundation and data rules work.

## Phase 0 — Discovery and environment
- Read SRS and module guide.
- Confirm project root, tools, Android environment, and Git.
- Create scope/traceability/assumptions docs.
- Identify requirement conflicts and missing owner decisions.

**Exit:** environment report and approved scope boundary exist; unrelated work is safe.

## Phase 1 — Foundation
- Create Expo TypeScript app.
- Configure strict typing, navigation, linting, tests, theme tokens, error model, and local persistence abstraction.
- Launch starter app and verify baseline.

**Exit:** clean install, launch, type check, lint, and baseline tests run successfully or limitations are documented.

## Phase 2 — Design system and navigation
- Build splash/bootstrap, role-aware navigation shells, reusable components, skeletons, empty/error/offline states, and localization foundation.

**Exit:** each supported role has coherent navigation; no portals or dashboards on splash; no dead-end screens.

## Phase 3 — Authentication and organization
- Registration request, demo login, OTP simulation, lockout, session restore/logout, account states, profile, language, privacy acknowledgement.

**Exit:** test accounts route correctly and suspended/pending users cannot transact.

## Phase 4 — Supplier stock and agent verification
- Supplier profile and verification state, lot wizard, photo flow, local draft, task queue, supplier visit, grading template, offline persistence, immutable submission, sync queue.

**Exit:** supplier and agent workflows operate end-to-end in mock mode; unverified lots are never buyer-visible.

## Phase 5 — Buyer extension
- Catalogue/filtering, cached browse, request drafts/submission, request list/status/expiry, organization status.

**Exit:** buyer can browse only verified stock and create a coherent request.

## Phase 6 — Offers and orders
- Mock admin-seeded offers, negotiation history, atomic reservations, order creation, supplier allocation confirmation, terms acceptance, order timelines.

**Exit:** inventory cannot be double-reserved; invalid transitions are rejected and tested.

## Phase 7 — Payments, delivery, disputes, and records
- Mock payment adapter, payment-before-dispatch, delivery receipt, quantity/quality differences, acceptance, settlement eligibility, dispute holds, invoice/trade records, notification deep links.

**Exit:** a complete demo trade can be followed without falsely claiming money moved or EBM was integrated.

## Phase 8 — Localization, accessibility, and hardening
- Complete translations, accessibility review, performance checks, privacy tests, error recovery, low-storage/poor-network tests, automated critical journeys.

**Exit:** mandatory requirements have traceability evidence and critical test results are recorded.

## Phase 9 — Android release preparation
- Release-like build, device smoke test, privacy/store checklist, dependency review, assets/license check, handover documentation.

**Exit:** release checklist is honestly marked Ready, Blocked, or Not verified. Do not claim public-store readiness if backend, policy, legal, signing, or owner-provided details remain missing.

Phases may overlap only when dependencies are respected. Explain meaningful deviations.

# 24. DEFINITION OF DONE

Do not call the app complete just because the screens look attractive.

The mobile MVP is complete for the agreed mock stage only when:
- It starts from a clean Expo React Native TypeScript repository.
- The supported development app launches.
- The navigation is polished and role-aware.
- Supplier and field-agent core workflows work.
- The explicitly requested buyer mobile extension works and is documented as an extension of the SRS buyer web scope.
- Forms validate and persist meaningful state.
- Lot visibility respects grading and admin verification.
- Inspection drafts and queue survive restarts.
- Sync retries are idempotent and honest.
- Buyer privacy projections omit private supplier details.
- Orders, offers, payments, dispatch, delivery, acceptance, settlement, and disputes obey the domain rules.
- No mock action pretends to move real money or call a real provider.
- Kinyarwanda and English cover all essential screens.
- Loading, empty, offline, permission, error, and success states are implemented.
- Critical domain and journey tests exist and actual results are recorded.
- Type checks, lint, tests, and available Android checks are reported accurately.
- Setup, architecture, demo, security, traceability, and release documentation are present.
- Git changes are reviewable and contain no secrets.
- Known limitations and next tasks are explicit.

“Ready for future backend integration” is not the same as “connected to backend.” “Prepared for Android store release” is not the same as “published” or “fully production-ready.”

# 25. REQUIRED WORKING STYLE AND MILESTONE REPORT

Start now.

**First action:** inspect the actual project root and development environment, then read the supplied Cargo SRS and Module Guide. Do not begin by generating screens.

At each milestone, report in simple language:
1. What was implemented.
2. Which user journey now works.
3. Files/modules changed.
4. Important decisions and why.
5. Commands actually executed.
6. Real results of tests/builds.
7. Commits actually created, if any.
8. Remaining limitations or blockers.
9. The next concrete task.

Work one small, verified step at a time. If you discover a problem, fix it rather than hiding it. If a requirement needs a decision, document it and ask only when the choice affects safety, money, privacy, or major product scope. Otherwise choose the simplest safe and reversible option.

Do not finish after the first phase. Continue implementing the agreed scope, test it, polish it, and prepare a professional handover.

**Final mission:** Build Cargo Mobile as a genuinely useful, premium, accessible, privacy-conscious, offline-capable agricultural operations app for Rwanda—with real working interactions, honest mock services, reliable business rules, and a clean path to the future Cargo backend.
