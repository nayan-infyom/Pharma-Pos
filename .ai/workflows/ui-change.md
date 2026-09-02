# .ai/workflows/ui-change.md — Standard Operating Procedure: UI & Layout Adjustments

Follow this playbook when altering user interfaces, modifying layouts, or refining visual styling.

---

## 11-Step UI Adjustment Protocol

1. **Understand User Goal**:
   - Determine what workflow efficiency, visual clarity, or hierarchy issue the UI change addresses.
2. **Review Existing Workflow**:
   - Trace how the user currently navigates or interacts with the target screen.
3. **Check UX Guidelines**:
   - Review `UX_GUIDELINES.md` and `.ai/skills/ux.md`.
   - **MANDATORY**: Ensure all styles remain **Strictly Light Mode Only**. Do NOT add dark mode or dark classes.
4. **Locate Existing UI Components**:
   - Check `src/components/ui/` (`Button`, `Badge`, `Card`, `Modal`, `Drawer`, `Tabs`, `Input`, `Select`).
5. **Preserve Existing Functionality**:
   - Ensure all event handlers, onClick callbacks, keyboard shortcuts, and form bindings remain intact.
6. **Improve Information Hierarchy**:
   - Use whitespace, font weights (`semibold`/`bold`), and subtle borders rather than nested cards or heavy shadows.
7. **Ensure Responsive Behavior**:
   - Design with mobile/tablet breakpoints (`sm:`, `md:`, `lg:`) to ensure tables and drawers adapt fluidly.
8. **Check Hover, Active & Focus States**:
   - Ensure interactive elements provide visible feedback on mouse hover, key focus, and button press.
9. **Check Loading & Empty States**:
   - Verify that `<Skeleton />` loaders display during async operations and `<EmptyState />` appears for empty lists.
10. **Run TypeScript Check & Build**:
    - Run `npm run lint` and `npm run build`.
11. **Review Final Visuals**:
    - Confirm the layout looks clean, crisp, clinical, and calm.
