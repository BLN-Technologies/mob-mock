# Cargo V1 Mobile Architecture & Engineering Guide

**Version:** 1.0  
**Target Platform:** Android First (React Native + TypeScript + Expo)  
**Date:** October 2026  

---

## 1. System Overview

Cargo V1 Mobile is designed around a strictly layered, feature-oriented modular architecture. It enforces domain rules, role permissions, and privacy projections at the service boundary rather than relying on UI component visibility.

```
src/
├── app/
│   ├── bootstrap/          # Branded splash screen and session restoration
│   └── navigation/         # Role-based navigation shells (Supplier, Agent, Buyer, Admin)
├── components/
│   ├── forms/              # Outdoors-readable FormField with validation
│   ├── feedback/           # EmptyState and status indicators
│   └── ui/                 # Button, Card, StatusBadge, OfflineBanner
├── data/
│   └── local/              # AsyncStorage persistence (session, drafts, offline queue)
├── domain/
│   ├── calculations/       # Fee, settlement, quantity (kg -> t), and RWF formatting
│   ├── enums/              # Status models for Lots, Orders, Grades, Payments
│   ├── models/             # Typed domain entities
│   ├── permissions/        # Role capability guards
│   ├── projections/        # Buyer privacy wrappers (omitting supplier phone/GPS)
│   ├── validation/         # Lot declaration and input validation
│   └── workflows/          # State machines for Lots (BR-02) and Orders (BR-03)
├── features/
│   ├── admin-handoff/      # Safe web portal redirection for administrators
│   ├── agent/              # Inspection tasks, grading forms, and offline queue
│   ├── auth/               # Login, quick test accounts, and 2FA OTP simulation
│   ├── buyer/              # Discover catalogue, request wizard, offers & orders
│   ├── notifications/      # Localized notification inbox
│   ├── profile/            # Profile, language toggle, and demo data reset
│   └── supplier/           # Dashboard, lot wizard (BR-01), orders & payouts
├── i18n/
│   ├── en.ts               # Complete English translation dictionary
│   ├── rw.ts               # Complete Kinyarwanda translation dictionary
│   └── index.tsx           # Context provider and useTranslation hook
├── services/
│   └── mock/               # Honest, persistent mock service adapters and seed data
└── theme/
    └── tokens.ts           # Approved brand colors, typography, radii, and shadows
```

---

## 2. Architectural Boundaries & Principles

1. **Pure Domain Logic:** Files in `src/domain/` contain no React components or device-specific APIs. They are 100% portable and unit-testable directly under Node.js.
2. **Privacy Projection:** Buyers never receive raw internal supplier database models. All catalogue and order allocation endpoints project through `projectLotForBuyer` and `projectAllocationsForBuyer`, stripping private phone numbers and coordinates.
3. **Offline Resilience:** Actions performed without connectivity are appended to `@cargo_offline_queue` with client UUIDs (`opId`). Synchronization operations are idempotent and server-authoritative.
4. **Honest Mock Services:** In mock mode, services simulate network latency, report realistic errors, and persist state across app reloads, without falsely claiming a live backend or executing fake financial transfers.
