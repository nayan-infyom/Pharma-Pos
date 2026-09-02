# UX_GUIDELINES.md — User Experience & Interface Design System

This document is the **permanent UX and UI design source of truth** for the Pharma POS application.

---

## 1. Absolute Directives
1. **STRICTLY LIGHT MODE ONLY**:
   - The application is designed exclusively in a clean, crisp, medical-grade **Light Theme**.
   - Future AI coding assistants and developers **MUST NOT** add dark mode, dark themes, theme toggles, or `dark:` Tailwind classes.
2. **Clinical Clarity Over Visual Decoration**:
   - Every pixel, border, and badge must serve an operational purpose: distinguishing drug schedules, alerting on near-expiry lots, or facilitating fast keyboard entry.
   - Avoid purple-to-blue gradients, glowing neon drop-shadows, arbitrary glassmorphism, or nested cards.

---

## 2. Core UX Principles for Pharmacy Operations
1. **Sub-Second Keyboard Ergonomics**: Counter pharmacists operate in high-throughput environments. POS actions have direct keyboard mappings (`F2` to checkout, `F4` to park/hold sale, `F8` to resume, `Ctrl+K` for global search, `Esc` to close).
2. **No Silent Click Handlers or Missing States**: Every button and input has clear focus rings, hover responses, active presses, disabled states, and empty states.
3. **Information Density with Breathing Room**: Use structured tabular layouts with clear column alignments (numbers right-aligned, text left-aligned, status badges centered).
4. **Visual Hierarchy Without Nested Cards**: Avoid placing cards inside cards. Use clean dividers (`border-slate-100` / `border-slate-200`), subtle backgrounds (`bg-slate-50`), and crisp typography.
5. **No Color-Only State Communication**: Status badges always combine an explicit text label with distinct, high-contrast color tokens and icons (e.g., Red "Expired", Amber "Expires in 15d", Emerald "In Stock").

---

## 3. Visual Design System

### Color Palette (Tailwind Tokens)
- **Canvas / Background**: `bg-slate-50` / `bg-slate-100/60` (Clean, cool neutral, zero eye strain).
- **Surface / Cards**: `bg-white` with `border border-slate-200/80` and subtle elevation (`shadow-xs` / `shadow-sm`).
- **Primary Brand Accent**: `emerald-600` (Hover: `emerald-700`, Active: `emerald-800`) — representing health, pharmacy, and precision.
- **Secondary Accent**: `sky-600` / `indigo-600` (For technical actions, reports, and search).
- **Text Scale**:
  - Headings / Drug Names: `text-slate-900` (Font weight: `semibold` / `bold`).
  - Secondary Text / Generics: `text-slate-500` / `text-slate-600` (Font weight: `normal`).
  - Monospace Numerics: `font-mono text-slate-800` (For currency, batches, GSTIN, and barcodes).

### Expiry & Urgency Alert Tokens
| Status | Background | Text Color | Border | Usage |
|---|---|---|---|---|
| **Expired** | `bg-rose-50` | `text-rose-700` | `border-rose-200` | Expired lots (dispensing strictly blocked) |
| **Critical (<7d)** | `bg-rose-50` | `text-rose-600` | `border-rose-200` | Immediate return / write-off required |
| **Near Expiry (<30d)** | `bg-amber-50` | `text-amber-700` | `border-amber-200` | High-priority FEFO push |
| **Watchlist (<90d)** | `bg-sky-50` | `text-sky-700` | `border-sky-200` | Procurement monitoring |
| **Healthy Stock** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Normal shelf stock |

---

## 4. Component Patterns

### Buttons (`src/components/ui/Button.tsx`)
- Standard heights: `h-9` (36px for dense table actions) or `h-10` (40px for standard forms) or `h-12` (48px for primary POS checkout buttons).
- Padding: Horizontal padding must equal $2\times$ vertical padding (e.g. `px-4 py-2`).
- Focus: `focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1`.

### Data Tables
- Header: `bg-slate-50/80`, `text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200`.
- Cells: `py-2.5 px-3.5 text-xs text-slate-700 border-b border-slate-100`.
- Hover: `hover:bg-slate-50/60 transition-colors`.

### Drawers & Modals (`src/components/ui/Drawer.tsx`, `Modal.tsx`)
- Slide-in from right for detail inspection drawers (`w-full max-w-lg`).
- Centered backdrop blur (`backdrop-blur-[2px] bg-slate-900/40`) for modals.
- Header with title, icon, and explicit close button; sticky footer with action buttons.

---

## 5. POS Flow UX Optimization
The primary billing screen is engineered around the standard retail pharmacy checkout pipeline:
```
1. Search / Barcode Scan (Auto-focus input, Enter key adds directly)
             ↓
2. Auto Batch Assignment (FEFO - Earliest valid expiry selected)
             ↓
3. Cart Review (Live quantity controls, Schedule H badge inspection)
             ↓
4. Customer Link (Walk-in or registered patient with Khata & allergy info)
             ↓
5. Payment Modal (F2 shortcut -> Cash tender quick buttons / UPI / Credit)
             ↓
6. Complete & Receipt (Automated receipt modal + thermal/A4 print trigger)
```
