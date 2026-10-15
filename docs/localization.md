# Cargo V1 Mobile Localization Guide

**Version:** 1.0  
**Languages Supported:** Kinyarwanda (`rw`), English (`en`)  
**Default Language:** Kinyarwanda for Suppliers & Agents; English for Buyers  

---

## 1. Overview
As specified by SRS UI-02, the mobile application prioritizes accessibility for cooperative farmers in Rwanda by defaulting to Kinyarwanda for cooperative leaders and field agents. English is supported for institutional procurement buyers.

---

## 2. Key Terminology Alignment

| Concept | English (`en`) | Kinyarwanda (`rw`) |
| :--- | :--- | :--- |
| **Cooperative / Supplier** | Cooperative / Supplier | Koperative / Urugaga |
| **Field Agent** | Field Agent | Umukozi wo mu Murima |
| **Institutional Buyer** | Institutional Buyer | Umuguzi w'Ikigo |
| **Lot** | Harvest Lot | Umusaruro Weze |
| **Grade A (Premium)** | Grade A (Premium) | Icyiciro cya 1 (Cyiza cyane) |
| **Grade B (Standard)** | Grade B (Standard) | Icyiciro cya 2 (Gisanzwe) |
| **Order** | Order | Ibwiriza ry'Ibicuruzwa |
| **Payout** | Expected Payout | Amafaranga Ategerejwe |
| **Dispute** | Dispute | Amakimbirane / Ikirego |
| **Moisture Percentage** | Moisture (%) | Ubuhehere (%) |
| **Foreign Matter** | Foreign Matter (%) | Ibindi bintu bitarimo (%) |

---

## 3. Persistent Language Switching
Language selection is saved to `@cargo_app_language_v1` via AsyncStorage and applies immediately across all tabs, buttons, forms, badges, and notification templates without requiring an app restart.
