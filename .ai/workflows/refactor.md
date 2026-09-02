# .ai/workflows/refactor.md — Standard Operating Procedure: Code Refactoring

Follow this playbook when cleaning up technical debt, modularizing components, or reorganizing service logic.

---

## 8-Step Refactoring Protocol

1. **Identify Motivation for Refactoring**:
   - Refactor only when there is a clear benefit: reducing duplicate code, improving file token size, extracting shared logic, or decoupling tightly coupled modules.
2. **Understand Public Interfaces**:
   - Inspect all consumers of the target function, service, or component across `src/pages/` and `src/components/`.
3. **Preserve External Signatures**:
   - Avoid breaking public method signatures, prop names, or exported types unless updating all consumers in the same atomic change.
4. **Isolate Refactoring from Feature Work**:
   - Do not combine major feature additions with structural refactorings in a single change.
5. **Preserve Business Logic & Domain Invariants**:
   - Review `BUSINESS_RULES.md` to ensure FEFO ordering, GST formulas, stock deduction logic, and Khata updates remain 100% identical.
6. **Extract Sub-Components & Helpers**:
   - Move large modals, drawers, or table sections out of `App.tsx` or monolithic page files into modular sub-files.
7. **Run TypeScript Check**:
   - Execute `npm run lint` (`tsc --noEmit`) to verify that no broken imports or type mismatches were introduced.
8. **Run Build & Functional Verification**:
   - Execute `npm run build` and verify that the refactored module behaves identically in preview.
