# .ai/skills/pharma-domain.md — Pharmaceutical Domain Knowledge & Terminology

This document establishes the official domain vocabulary, regulatory rules, and commercial practices of retail pharmacy operations in India as modeled in this system.

---

## 1. Core Pharmaceutical Terminology

- **Medicine / Drug**: The commercial product formulated for therapeutic use (e.g. *Augmentin 625 Duo*).
- **Generic Name (Salt)**: The active chemical ingredient(s) and their exact strength breakdown (e.g. *Amoxicillin (500mg) + Clavulanic Acid (125mg)*). In Indian retail pharmacies, customers or doctors frequently request drugs by generic composition to find cost-effective substitutes.
- **Brand / Manufacturer**: The pharmaceutical marketing company or laboratory producing the product (e.g. *GSK*, *Cipla*, *Sun Pharma*, *Torrent*).
- **Dosage Form**: The physical formulation method: `Tablet`, `Capsule`, `Syrup`, `Injection`, `Ointment`, `Drops`, `Inhaler`, `Powder`, `Gel`, `Suspension`.
- **Strength**: The quantity of active drug per unit (e.g. `625 mg`, `500 mg`, `10 ml`, `250 mcg`).
- **Pack Size**: The retail unit packaging (e.g. `10 Tablets / Strip`, `100 ml Bottle`, `1 Vial`).

---

## 2. Pricing & Commercial Concepts

- **MRP (Maximum Retail Price)**: In India, by law, no pharmacy can sell a medicine above its printed MRP.
- **Purchase Price (Cost Price)**: The net rate at which the pharmacy acquired the lot from the wholesale distributor.
- **Selling Price (Counter Rate)**: The actual billed rate offered to walk-in or loyalty customers. In this system:
  $$\text{Selling Price} \le \text{MRP}$$
- **Trade Discount**: A percentage discount applied against MRP or subtotal.
- **GST (Goods and Services Tax)**: Indian indirect tax applied according to HSN codes:
  - **5% GST**: Essential formulations, vaccines, life-saving medicines.
  - **12% GST**: Standard manufactured pharmaceuticals, antibiotics, chronic care formulations.
  - **18% GST**: Medicated cosmetics, disinfectant washes, nutritional powders.
  - Split: Divided equally into Central GST (**CGST** = 50% of GST) and State GST (**SGST** = 50% of GST).

---

## 3. Inventory & Expiry Concepts

- **Batch (Lot)**: A specific manufacturing run with a unique `batchNumber`, `mfgDate`, and `expiryDate`.
- **FEFO (First Expiry, First Out)**: The mandatory dispensing rule where stock lots expiring soonest are dispensed first to prevent inventory write-offs.
- **Schedule H / H1 Drugs**: Under the Indian Drugs and Cosmetics Act, these prescription-only medications (antibiotics, sedatives, psychotropics) cannot be dispensed over-the-counter without a registered medical practitioner's prescription.
- **Patient Khata**: A trusted informal ledger account providing store credit to chronic patients (e.g. diabetes, hypertension patients buying monthly medication), settled periodically.
- **Supplier Payable**: Unsettled invoices owed by the pharmacy to wholesale drug distributors.
- **Sales Return**: Return of unconsumed, undamaged, non-expired medication by a patient for credit note or cash refund.
- **Purchase Return / Debit Note**: Return of near-expiry, damaged, or excess goods back to the distributor before expiry credit windows close.
