# .ai/skills/accessibility.md — Accessibility, Keyboard Ergonomics & ARIA Guidelines

This skill defines accessibility standards, keyboard navigation rules, and focus governance for all components and workflows.

---

## 1. Keyboard Navigation & Shortkeys

Pharmacy counters are fast-paced environments where pharmacists rely on keyboard shortcuts rather than mouse clicks:

- **Global Shortcuts**:
  - `F2`: Opens the POS payment modal from anywhere on the `/pos` page.
  - `F4`: Parks/holds the current POS cart.
  - `F8`: Opens the held sales drawer.
  - `Ctrl + K` / `Cmd + K`: Opens the universal Global Search Modal.
  - `Alt + N`: Opens the Quick Action Modal (`New Sale`, `+ Medicine`, `+ Purchase`, `+ Rx`).
  - `?`: Opens the Keyboard Shortcuts Cheatsheet Modal.
  - `Escape`: Closes any open modal, drawer, or search dialog.

- **Event Handler Safety Rule**:
  Always ensure keyboard listeners check `e.key` existence before calling methods like `.toLowerCase()`:
  ```typescript
  if (e.altKey && e.key && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    navigate('/pos');
  }
  ```

---

## 2. Focus Management

- **Modal Trap & Auto-Focus**:
  - When a modal or drawer opens, autofocus the primary input (e.g. search box or cash tender input).
  - When dismissed with `Escape` or the close button, return focus to the triggering element.
- **Visible Focus Rings**:
  - Never disable focus rings (`outline: none` without replacement).
  - Use `focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1`.

---

## 3. Semantic HTML & ARIA Attributes

- Use semantic HTML tags: `<main>`, `<nav>`, `<header>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<button>`, `<input>`, `<label>`.
- Interactive icon buttons must include an `aria-label`:
  ```tsx
  <button aria-label="Close modal" onClick={onClose}>
    <X className="w-5 h-5" />
  </button>
  ```
- Form controls must have associated `<label>` elements or `aria-labelledby` attributes.
- Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` for modals.

---

## 4. Color Contrast & Legibility

- Maintain WCAG AA compliance (contrast ratio $\ge 4.5:1$ for normal text, $\ge 3:1$ for large text).
- Never render light gray text (`text-slate-400`) on light colored badge backgrounds.
- High-contrast numbers: Use `text-slate-900` or `font-semibold font-mono` for financial values.
