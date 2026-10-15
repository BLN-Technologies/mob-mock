# Cargo V1 Domain Workflows & Business Invariants

**Version:** 1.0  
**Authority:** Cargo V1 SRS Sections 5.9, 7.1, 7.2  

---

## 1. Lot Lifecycle State Transitions

```
[Draft]
   │
   ▼ (Supplier submits lot with harvest confirmation)
[Submitted]
   │
   ├── (Agent inspects + Admin approves) ──► [Verified]
   │                                            │
   └── (Inspection / review fails)              ├── (Offer accepted by Buyer) ──► [Reserved]
          │                                     │                                    │
          ▼                                     ├── (Supplier withdraws)             ├── (Delivery accepted) ──► [Sold]
     [Rejected]                                 │      │                             │
                                                │      ▼                             └── (Order cancelled) ────► [Verified]
                                                │   [Withdrawn]
                                                │
                                                └── (Configured period passes) ──► [Expired]
```

### Invariants:
- **BR-01:** Harvest date must be today or earlier. Pre-harvest listings are rejected.
- **BR-02:** A lot is visible to buyers in the catalogue ONLY if `status === LotStatus.VERIFIED`, `lot.grade` is defined, and `lot.adminApprovedAt` is recorded.
- **Partial Sales:** `remainingQuantityKg` decreases when allocations are reserved or sold. A lot remains visible with remaining stock until fully depleted.

---

## 2. Order Lifecycle State Transitions

```
[Created]
   │
   ▼ (Buyer & all Suppliers confirm allocations and accept terms)
[Confirmed]
   │
   ▼ (Payment instructions issued via partner)
[Payment Pending]
   │
   ▼ (Partner confirms payment reference)
[Paid]
   │
   ▼ (Trip & Loading details recorded)
[Dispatched]
   │
   ▼ (Delivery recorded at buyer warehouse)
[Delivered]
   │
   ├── (Buyer inspects & accepts) ──────────► [Accepted] ──► [Settled] (Suppliers paid)
   │                                             │
   └── (Discrepancy beyond tolerance)            ├── (Problem reported)
          │                                      │      │
          ▼                                      ▼      ▼
     [Disputed] ◄────────────────────────────────┘
          │
          ▼ (Admin adjudicates: full / adjusted / refund)
     [Settled]
```

### Invariants:
- **BR-03:** Payment confirmation is strictly required before an order can transition to `Dispatched`.
- **BR-04:** Supplier payout eligibility is triggered only after buyer acceptance or approved dispute resolution.
- **FR-ORD-05:** Electronic terms acceptance is recorded with user ID and timestamp before payment.
- **BR-07:** Grading records and ledger entries are append-only. Corrections create new dated records.
