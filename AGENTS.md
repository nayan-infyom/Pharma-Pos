# AGENTS.md — AI Agent Development & Instruction Manual

This document is the **primary instruction manual** for any AI coding assistant (Google Gemini, Claude, Cursor, Copilot, ChatGPT, Windsurf, or automated agents) working on the Pharma POS codebase.

---

## 1. General Operating Rule
**Do not make changes simply because another implementation is possible.**
- Always prefer the **smallest correct change**.
- Avoid speculative refactors or adding unrequested libraries.
- Respect existing architectural patterns, file boundaries, and naming conventions.

---

## 2. Before Modifying Code (Mandatory Protocol)
Before writing or editing any code, the AI agent **MUST**:
1. **Understand Intent**: Carefully analyze what the user is asking to achieve.
2. **Search Existing Functionality**: Check if the requested feature, helper, or calculation already exists in `src/utils/`, `src/services/`, or `src/store/`.
3. **Search Existing Components**: Inspect `src/components/ui/` and `src/components/pos/` or `src/components/layout/` before creating new UI.
4. **Search Existing Services & Stores**: Review `src/services/` and `src/store/` to avoid creating duplicate service methods or redundant state.
5. **Search Existing Types**: Inspect `src/types/index.ts` to reuse established interfaces (`Medicine`, `Batch`, `CartItem`, `SaleInvoice`, `PurchaseOrder`, etc.).
6. **Identify Affected Workflows**: Determine if the change touches POS billing, inventory deduction, FEFO batch selection, returns, or Khata credit.
7. **Read Relevant Business Rules**: Review [BUSINESS_RULES.md](./BUSINESS_RULES.md) to verify domain invariants.
8. **Read Relevant AI Skill**: Check [.ai/SKILLS_INDEX.md](./.ai/SKILLS_INDEX.md) and load the specific skill file (e.g. `.ai/skills/pos.md`).

---

## 3. When Modifying Code
- **Reuse Existing Code**: Prefer existing UI components, service methods, and formatters (`formatINR`, `formatDate`, `getExpiryStatus`).
- **Avoid Duplicate Components**: Do not create a second modal, button, or badge when `src/components/ui/` already contains a configurable one.
- **Separation of Concerns**:
  - Keep presentation components focused on UI layout, keyboard events, and interaction feedback.
  - Keep business calculations, persistence, and data normalization inside `src/services/` or `src/store/`.
- **Preserve Existing Workflows**:
  - Do not break existing keyboard shortcuts (`F2` for POS, `F4` to hold sale, `F8` to resume, `Ctrl+K` for search, `Escape` to close modals).
  - Do not break active cart calculations or held sales persistence.
- **Preserve Accessibility & Responsiveness**: Keep semantic tags, ARIA labels, focus states, and responsive mobile/tablet layout support.
- **Maintain TypeScript Strictness**: Do not use `any` types. Ensure all fields match `src/types/index.ts`.

---

## 4. When Adding a New Component
Before creating a new file in `src/components/`:
1. Ask: *Does an existing component already solve this?*
   - If **yes**, customize/extend the existing component via props.
   - If **no**, create a modular, clean component in `src/components/ui/` (if general) or the appropriate feature folder.
2. Use named exports and PascalCase filenames.
3. Ensure every interactive element has accessible labels and clear keyboard focus styles.

---

## 5. When Adding State
Determine the correct state ownership level:
- **Component Local State (`useState`)**: For transient UI states (search input text, active tab, modal open/close, accordion toggles).
- **Global Zustand Store (`usePOSStore`, `useAppStore`)**: ONLY for state shared across multiple routes/views (active POS cart, held sales, global toast notifications, authenticated employee session, global search modal).
- **Service Layer Persistence (`src/services/`)**: For domain entities that must survive page refreshes and be accessible across views (Medicines, Sales Invoices, Customers, Purchases, Prescriptions, Stock Movements).

> **Rule**: Do not put everything into global Zustand state.

---

## 6. When Adding Business Logic
- **Do not put complex pharmacy calculations directly into JSX markup.**
- Place data transformations, validation rules, and persistence in the appropriate service class (`src/services/*Service.ts`) or store action.
- Formatters belong in `src/utils/formatters.ts`.

---

## 7. Critical Pharmacy Safety Rules (DO NOT BREAK)
Future AI agents must **NEVER** casually modify or bypass:
1. **Expiry Validation**: Expired medicine batches (`daysUntilExpiry <= 0` or `status === 'Expired'`) must NEVER be added to the POS cart or dispensed.
2. **Stock Constraints**: A batch cannot be sold in quantities greater than its available quantity (unless explicitly overridden by admin settings).
3. **FEFO Ordering**: When adding a medicine without a specific batch selection, the system MUST pick the earliest expiring active batch with positive stock (`quantity > 0`).
4. **Prescription Verification**: Schedule H or prescription-required drugs must trigger a doctor/prescription check warning.
5. **GST / Tax Calculation**: GST (5%, 12%, 18%) must be calculated accurately on the discounted line-item price:
   $$\text{Tax Amount} = \frac{(\text{Unit Price} \times \text{Quantity} - \text{Discount}) \times \text{GST Rate}}{100}$$
6. **Khata (Credit) Integrity**: Sales made via `PaymentMethod === 'Credit'` MUST increment the customer's `outstandingBalance`. Balance settlements must decrement `outstandingBalance` with floor at 0.
7. **Return Eligibility**: Returned quantities cannot exceed the original invoice item's sold quantity. Restocked items must return to inventory via `medicineService.addStock` and log an inventory movement.

---

## 8. Strictly Light Mode Only (UX Invariant)
- **The application is strictly LIGHT MODE ONLY.**
- Do **NOT** add dark mode, dark themes, theme toggles, or `dark:` Tailwind classes.
- The visual identity is clean, crisp, high-contrast, clinical, and calm (Slate/Emerald/Sky palette with subtle borders and crisp typography).

---

## 9. After Modifying Code (Verification Checklist)
Every AI agent must execute the following verification cycle before finishing a task:
1. **Run TypeScript check / Linter**: Ensure `tsc --noEmit` passes with 0 errors.
2. **Check App Compilation**: Ensure Vite builds without errors.
3. **Verify Edge Cases**:
   - Check empty states (e.g. empty cart, no search results).
   - Check loading & disabled button states.
   - Check responsive layouts on small screens.
   - Verify keyboard shortcuts and modal dismissals (`Esc`).
4. **No Regression**: Confirm that related routes, modals, and data persisting across localStorage continue working as expected.

---

## 10. Documentation Maintenance Rule
Whenever a change modifies architecture, business logic, or data structures:
- If a new service or store is created → Update [ARCHITECTURE.md](./ARCHITECTURE.md)
- If a business rule or formula changes → Update [BUSINESS_RULES.md](./BUSINESS_RULES.md)
- If a data model interface changes → Update [DATA_MODEL.md](./DATA_MODEL.md)
- If a product feature is added or removed → Update [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)
- If project milestones change → Update [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- If a new AI skill is added → Update [.ai/SKILLS_INDEX.md](./.ai/SKILLS_INDEX.md)
- Keep all documentation synchronized with the live codebase at all times.
