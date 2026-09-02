# .ai/README.md — AI Agent Onboarding & Skills Gateway

Welcome, AI Coding Assistant (Gemini, Claude, Cursor, Copilot, ChatGPT, Windsurf, or automated agents).

This folder contains the **universal domain knowledge base, specialized skill manuals, and standard workflow playbooks** for the Pharma POS application.

---

## 1. Recommended AI Reading Order

When beginning work on this codebase, follow this sequential onboarding path:

1. **`../AI_CONTEXT.md`**: High-level overview of the product, tech stack, directory structure, and current phase.
2. **`../AGENTS.md`**: Strict operating rules, coding mandates, and safety constraints.
3. **`SKILLS_INDEX.md`**: Locate the specific technical or domain skill for your assigned task.
4. **`../BUSINESS_RULES.md`**: Check domain calculations, FEFO logic, and validation rules.
5. **`workflows/<workflow-name>.md`**: Follow the exact step-by-step procedure for your task type (e.g. bug fix, new feature, UI adjustment).

---

## 2. Quick Skill Routing Matrix

| Task Area | Primary Skill Document | Secondary References |
|---|---|---|
| **POS Billing, Cart, Checkout, Split Pay** | `skills/pos.md` | `../BUSINESS_RULES.md` |
| **Batches, Expiry, Stock Audit, FEFO** | `skills/inventory.md` | `skills/pharma-domain.md` |
| **Sales Invoices, Refunds, Receipts** | `skills/sales.md` | `skills/pos.md` |
| **Inward Purchase Orders, Stock Intake** | `skills/purchases.md` | `skills/inventory.md` |
| **Doctor Prescriptions, POS Transfer** | `skills/prescriptions.md` | `skills/pharma-domain.md` |
| **Customer Khata, Debt Settlement, Suppliers** | `skills/customers-and-suppliers.md` | `../BUSINESS_RULES.md` |
| **React Components, Zustand, Services** | `skills/frontend.md` | `../ARCHITECTURE.md` |
| **Visual Styling, Layout, Light Theme** | `skills/ux.md` | `../UX_GUIDELINES.md` |
| **Keyboard Accessibility, Focus, ARIA** | `skills/accessibility.md` | `skills/ux.md` |
| **Verification, Testing & Regressions** | `skills/testing.md` | `workflows/bug-fix.md` |

---

## 3. Workflows Routing Matrix

| Task Type | Workflow Playbook |
|---|---|
| Implementing a new feature / module | `workflows/new-feature.md` |
| Fixing a bug or unexpected error | `workflows/bug-fix.md` |
| Modifying UI, styling, or layout | `workflows/ui-change.md` |
| Refactoring services or components | `workflows/refactor.md` |
| Future API / Backend integration | `workflows/backend-integration.md` |
