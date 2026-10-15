# Cargo V1 Android Store Release Readiness Checklist

**Version:** 1.0  
**Target OS:** Android 8.0+ (API 26+)  
**Application ID:** `rw.cargo.mobile`  
**Application Name:** Cargo  

---

## 1. Technical & Build Readiness
- [x] Strict TypeScript compilation passes with zero errors (`npm run typecheck`).
- [x] Automated domain rule test suite passes 100% (`npm test`).
- [x] Application ID set to `rw.cargo.mobile` in `app.json`.
- [x] Version Code: 1, Version Name: `1.0.0`.
- [x] Target orientations locked to portrait in `app.json`.
- [x] Adaptive icon configured with brand green `#0FAA38`.
- [x] Splash screen configured with brand color `#0FAA38`.
- [x] Touch targets verified >= 48dp for outdoor usability.
- [x] Safe area insets handled across all navigation shells.
- [x] Offline action queue persistent via AsyncStorage.

---

## 2. Privacy, Permissions & Legal Readiness
- [x] **No Card / PIN Storage (FR-PAY-06):** Verified that no payment credentials or mobile money PINs are collected or stored.
- [x] **Marketplace Contact Privacy (BR-05):** Verified that buyer projections omit cooperative personal phone numbers and farm coordinates.
- [x] **Camera Permission:** Used only for produce photos and grading evidence.
- [x] **Location Permission:** Used only for optional field visit verification; manual fallback provided if denied.
- [ ] **Public Privacy Policy URL:** Requires owner deployment of policy page to `https://cargo.rw/privacy`. *(Release Blocker for Google Play)*
- [ ] **Terms of Service URL:** Requires owner deployment to `https://cargo.rw/terms`. *(Release Blocker for Google Play)*
- [ ] **Google Play Console Account:** Requires Cargo organizational developer account setup.
- [ ] **Production Keystore Signing:** Keystore must be generated and stored securely outside git repository (via Expo EAS Secrets).

---

## 3. Backend Integration Status
- Current build uses self-contained, typed local mock service adapters (`services/mock/`).
- The application is **prepared for future backend integration** via documented service contracts (`services/contracts/`) but is explicitly labeled as a **demo/pilot build** until live NestJS/PostgreSQL endpoints are deployed.
