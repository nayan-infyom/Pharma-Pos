# .ai/workflows/new-feature.md — Standard Operating Procedure: New Feature Implementation

Follow this 17-step playbook whenever implementing a new feature or module in the Pharma POS codebase.

---

## The 17-Step Playbook

1. **Understand Requirement**: Deconstruct the user prompt into specific user stories, input/output data, and target routes.
2. **Identify Affected Domain**: Determine if the feature touches POS billing, medicines, inventory, customers, prescriptions, or purchases.
3. **Search Existing Code**: Search `src/` to see if a similar component, hook, or service method already exists.
4. **Search Existing Components**: Inspect `src/components/ui/` (`Button`, `Modal`, `Drawer`, `Badge`, `Input`, `Select`) to reuse primitives.
5. **Search Existing Services**: Check `src/services/` to extend the appropriate singleton rather than creating duplicate logic.
6. **Search Existing State**: Check if state should be local (`useState`), in `usePOSStore`, or in `useAppStore`.
7. **Read Relevant AI Skill**: Consult the relevant `.ai/skills/*.md` document for domain context.
8. **Read Business Rules**: Review `BUSINESS_RULES.md` for calculation formulas and safety invariants.
9. **Plan Minimal Implementation**: Formulate a concise plan targeting the smallest correct set of changes.
10. **Define / Update Types**: If new data structures are needed, declare them in `src/types/index.ts`.
11. **Implement Service Logic**: Add data manipulation methods in `src/services/` and update fixtures if needed.
12. **Implement UI / Page View**: Build the presentation view using Tailwind CSS (**Light Mode Only**).
13. **Wire Keyboard Shortcuts & Accessibility**: Add accessible labels, focus traps, and shortcuts if appropriate.
14. **Handle Error & Empty States**: Add `<EmptyState />` for zero records and `<Skeleton />` or loading spinners.
15. **Verify TypeScript & Linting**: Run `npm run lint` (`tsc --noEmit`) to verify 0 errors.
16. **Build Applet**: Run `npm run build` to verify production compilation.
17. **Summarize Changes**: Provide a concise summary of functional outcomes without promotional hype.
