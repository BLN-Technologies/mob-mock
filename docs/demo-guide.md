# Cargo V1 Mobile Demonstration & Verification Guide

Follow these exact steps to demonstrate all core user journeys, business invariants, and offline capabilities.

---

## 🌾 Journey 1: Cooperative Leader (Supplier)
1. Launch the app (or log out to reach the login screen).
2. Tap the quick-fill button: **"🌾 Umuyobozi wa Koperative (Urugaga)"** (`+250788111222`).
3. Tap **"Injira" (Login)**. Enter any 6-digit OTP (e.g. `123456`) and tap **"Emeza Imibare"**.
4. You land on the **Supplier Dashboard**:
   - Verify active lot metrics: 1 Active Lot, 1 Pending Inspection, 1 Order in Progress, Expected Payouts in RWF.
5. Tap **"Tanga Umusaruro Weze" (Declare Harvest Lot)**:
   - **Step 1:** Enter Crop Type (`Maize`), Quantity (`5000` kg), Price per kg (`420` RWF). Tap Next.
   - **Step 2 (BR-01 Check):** Notice the harvest confirmation checkbox. If unconfirmed, the app prevents submission. Confirm harvest and set harvest date. Tap Next.
   - **Step 3:** Enter Pickup District (`Nyagatare`), Sector, and warehouse details. Tap **"Ohereza ngo Usurwe" (Submit)**.
6. The lot is created in status `SUBMITTED`. It is awaiting Field Agent quality inspection.

---

## 📋 Journey 2: Cargo Field Agent (Offline Inspection & Sync)
1. Navigate to **Profile > Sohoka (Log Out)**.
2. Tap the quick-fill button: **"📋 Umukozi wo mu murima (Isuzuma)"** (`+250788333444`).
3. Log in with OTP `123456`.
4. You land on **Field Tasks**:
   - Notice the newly submitted harvest lot from Journey 1 listed under Nyagatare.
5. **Test Offline-First Capability:**
   - Tap the top banner **"Online Mode"** to switch to **"Offline Mode"**.
   - Tap the task card to open the **Grading Form**.
   - Enter measurements: Moisture: `13.0%`, Foreign Matter: `0.7%`, Defective Grain: `1.2%`.
   - Notice the live calculated grade dynamically proposes **Grade A (Premium)**.
   - Tap **"Emeza Ibisubizo by'Ubuziranenge" (Submit Grading)**.
   - An alert confirms the record was saved directly to the **local offline queue** (FR-QA-03).
6. Tap the **Queue** tab at the bottom:
   - Notice the queued item with its unique operation ID (`opId`) and `QUEUED` status.
7. Tap the top banner again to return to **"Online Mode"**.
8. Tap **"Sync All"**:
   - The queue item synchronizes with the Cargo service layer, transitions the lot to `VERIFIED`, and updates to `SYNCED`.

---

## 🏢 Journey 3: Institutional Bulk Buyer
1. Navigate to **Profile > Log Out**.
2. Tap the quick-fill button: **"🏢 Institutional Buyer"** (`+250788555666`).
3. Log in with OTP `123456`.
4. You land on **Verified Produce (Discover)**:
   - Verify that the lot graded in Journey 2 is now visible with **Grade A** badge.
   - Verify **Privacy Protection (BR-05):** The card displays available quantity and general district (`Nyagatare`), but strips private cooperative phone numbers and farm coordinates.
5. Tap on the lot to open **Lot Details**:
   - Inspect the verified quality timeline (Harvest confirmed -> Graded Grade A -> Approved).
6. Tap the **Offers** tab in the bottom bar:
   - Review pooled offer `OFF-202610-001` (15,000 kg Grade A Maize).
   - Review the complete negotiation timeline.
   - Tap **"Accept Offer & Reserve Stock"**:
   - An alert confirms atomic reservation across constituent lots. The offer moves to `ACCEPTED` and a new confirmed Order is generated (FR-ORD-01).
7. Tap the **Orders** tab:
   - Select the newly confirmed order.
   - Tap **"Simulate Demo Payment"**:
   - Select **"Confirm MoMo Payment (Demo)"**.
   - The order immediately transitions to `PAID` with a partner reference (e.g. `MOMO-RW-******`) and authorizes dispatch (BR-03).
8. **Delivery Receipt & Dispute Inspection:**
   - Select Order `#ORD-202610-002` (Dry Beans in `DELIVERED` status).
   - Tap **"Record Delivery Receipt"**.
   - Enter quantity received: `8000` kg.
   - Tap **"Open Quality Dispute"**:
   - Notice that opening the dispute immediately flags the order as `DISPUTED` and pauses supplier settlement (BR-04, FR-DSP-02).

---

## ⚙️ Journey 4: Cargo Administrator (Web Handoff)
1. Log out and tap **"⚙️ Cargo Administrator"** (`+250788999000`).
2. Log in with OTP `123456`.
3. The app presents the **Web Administration Handoff** screen, clearly explaining that master settings, dispute adjudication, and multi-cooperative pooling are managed on the web platform (`https://admin.cargo.rw`).
