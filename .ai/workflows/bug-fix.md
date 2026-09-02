# .ai/workflows/bug-fix.md — Standard Operating Procedure: Bug Fixes & Error Resolution

Follow this playbook to diagnose, reproduce, isolate, and fix runtime errors or behavioral regressions.

---

## 10-Step Bug Fix Protocol

1. **Analyze Error Message & Stack Trace**:
   - Identify exact error type (e.g. `Cannot read properties of undefined (reading 'length')`, `TypeError`, or state mismatch).
   - Identify file, function, and line number where the exception occurred.
2. **Reproduce & Trace Root Cause**:
   - Trace the lifecycle of the undefined/null property from its data source (`src/data/`, `src/services/`, or `localStorage`).
   - Check if the property is optional in `src/types/index.ts` and missing fallback protection (`?.length || 0`, `|| []`, `|| ''`).
3. **Inspect Affected State / Data**:
   - Check if cached data in `localStorage` from older schema versions lacks the newly expected property.
   - Implement backward-compatible normalization in the service layer constructor (e.g. `normalizePrescription`).
4. **Review Business Rules**:
   - Consult `BUSINESS_RULES.md` to ensure the proposed fix does not violate domain rules (FEFO, GST calculation, stock clamping).
5. **Apply Targeted Root-Cause Fix**:
   - Fix the actual underlying issue rather than applying a cosmetic wrapper.
   - Avoid creating new state variables if existing store/service methods suffice.
6. **Defensive Guarding**:
   - Add optional chaining (`?.`), nullish coalescing (`??`), or default values for all user inputs and external records.
7. **Verify Keyboard & Event Handlers**:
   - When fixing keyboard listeners, always verify `e.key` existence before calling string transformations like `.toLowerCase()`.
8. **Run TypeScript Check**:
   - Execute `npm run lint` (`tsc --noEmit`) to verify that types are sound.
9. **Run Applet Build**:
   - Execute `npm run build` to verify production compilation.
10. **Test Related Workflows**:
    - Perform a manual sanity check on dependent screens (e.g. if POS cart was modified, verify checkout, receipt modal, and held sales).
