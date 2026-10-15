# Cargo V1 Mobile Security & Privacy Specification

**Version:** 1.0  
**Authority:** Cargo V1 SRS Section 5.3 & 5.4, Law Nº 058/2021 on Personal Data Protection in Rwanda  

---

## 1. Marketplace Anonymity & Data Protection (BR-05)

To prevent off-platform disintermediation and protect cooperative leadership from unsolicited direct contact:
- **Buyer Projection Gate:** Buyers browsing the produce catalogue or reviewing allocated orders never see:
  - Cooperative leader personal names
  - Cooperative phone numbers or email addresses
  - Specific GPS coordinates or private farm plots
- Permitted buyer view attributes:
  - Crop & Variety
  - Verified Quality Grade (Grade A, B, C)
  - General District (e.g. `Nyagatare`, `Huye`, `Musanze`)
  - Available Quantity in kg & metric tons
  - Price per kg in RWF
  - Inspected produce photos

---

## 2. Financial Security & Payment Data (FR-PAY-06)

- The mobile application **never** captures, requests, stores, or logs:
  - Mobile Money PINs (MTN MoMo, Airtel Money)
  - Credit / Debit Card numbers or CVVs
  - Bank account passwords
- All simulated and future real payments use licensed partner redirect callbacks with cryptographic signature verification.

---

## 3. Account Protection & Lockout (FR-AUTH-05, FR-AUTH-07)

- Accounts are temporarily locked after repeated failed authentication attempts.
- Suspended accounts are immediately rejected by service guards and cannot transact.
- Simulated Two-Factor Verification (OTP) is demonstrated on all first logins to mirror the production security architecture.
