# .ai/skills/ux.md — Practical UX Design & Layout Guide

This skill provides practical UI/UX guidelines for building new screens, modals, tables, and workflows in the Pharma POS application.

---

## 1. Absolute Rule: Strictly Light Mode Only

- **No Dark Themes**: Do NOT generate dark backgrounds (`bg-slate-900`, `bg-gray-950`), dark cards, or dark theme switchers.
- **Visual Aesthetic**: Crisp, medical-grade, calm, high-contrast light theme (`bg-slate-50` canvas, `bg-white` surfaces, `border-slate-200` dividers, `text-slate-900` headings, `emerald-600` primary accents).

---

## 2. Anti-Patterns to Avoid ("Anti-Slop")

- ❌ **No Nested Cards**: Do not place cards inside cards inside cards. Use clean dividers (`border-slate-100`) and whitespace instead.
- ❌ **No Arbitrary Glassmorphism**: Avoid `backdrop-blur-md` with transparent cards on bright gradients.
- ❌ **No Floating Glow Effects**: Avoid `shadow-emerald-500/50` or pulsing neon rings.
- ❌ **No Verbose Marketing Copy**: Use concise, functional labels (e.g. `+ Add Medicine`, `Complete Sale [F2]`, `Settle Khata`).
- ❌ **No Color-Only Indicators**: Always combine color with an explicit status label or icon (e.g. Red + "Expired", Amber + "Near Expiry (15d)").

---

## 3. Screen Structure Standards

Every standard administrative page (e.g. `/medicines`, `/customers`, `/suppliers`, `/purchases`) must follow this standardized header & filter structure:

```tsx
<div className="space-y-6">
  {/* 1. Page Header */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-xl font-bold text-slate-900">Module Title</h1>
      <p className="text-xs text-slate-500 mt-0.5">Concise description of the operational view.</p>
    </div>
    <div className="flex items-center gap-2.5">
      <Button variant="secondary" onClick={handleExport}>Export</Button>
      <Button variant="primary" onClick={handleAddNew}>+ Add New</Button>
    </div>
  </div>

  {/* 2. KPI Summary Bar (Optional) */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
    {/* KPI Metric Cards */}
  </div>

  {/* 3. Search & Filter Bar */}
  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
    {/* Search Input + Dropdown Filters */}
  </div>

  {/* 4. Main Data Table or Grid */}
  <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
    {/* Clean Tabular Data */}
  </div>
</div>
```

---

## 4. Interaction States

- **Hover**: Subtle background tint (`hover:bg-slate-50/75` for table rows; `hover:bg-emerald-700` for primary buttons).
- **Active / Press**: Slight scale or background deepening (`active:scale-[0.98]`).
- **Focus**: Distinct accessible focus ring (`focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1`).
- **Empty State**: Use `<EmptyState title="..." description="..." icon={...} action={...} />`.
- **Loading State**: Use `<Skeleton className="h-10 w-full" />` or `<Button isLoading={true} />`.
