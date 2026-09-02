# Pharma POS — Apex Care Pharmacy Management System

A specialized, high-performance retail pharmacy management and Point of Sale (POS) application designed for pharmacies, clinical dispensing counters, and medical stores.

---

## Key Features

- **Fast POS Counter Billing**: Sub-second keyboard-driven checkout (`F2` to tender, `F4` to hold cart, `F8` to resume, instant barcode/name search, auto-batch selection).
- **Batch & FEFO Inventory Governance**: Granular lot tracking with manufacturing dates, expiry dates, and automatic First-Expiry-First-Out (FEFO) dispensing.
- **Expiry Loss Radar**: Real-time surveillance of batches expiring in <30, <60, or <90 days with financial loss exposure calculations.
- **Prescription-to-POS Dispensing**: Digital prescription repository with 1-click transfer of multi-drug regimens to the active POS cart.
- **Patient Khata & CRM**: Chronic illness tracking, drug allergy alerts, store credit limits, and balance settlements.
- **GST & Regulatory Compliance**: Line-item Indian GST (5%, 12%, 18%) calculation, Schedule H warnings, and drug license / GSTIN receipt headers.
- **Purchases & Returns**: Inward purchase order logging with bonus scheme quantities, sales returns with automatic stock restoration, and supplier debit notes.
- **Reports & Operating Overheads**: Gross margin metrics, category distribution charts, payment method splits, and store expense logging.

---

## Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6
- **Styling**: Tailwind CSS v4 (Strictly Light Mode Only)
- **State Management**: Zustand v5
- **Icons**: Lucide React
- **Charts**: Recharts v3
- **Animations**: Motion

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Type Checking & Production Build
```bash
# Run TypeScript compiler checks
npm run lint

# Build for production
npm run build
```

---

## Project Structure

```
/
├── AI_CONTEXT.md          # Primary overview for AI coding assistants
├── AGENTS.md              # Mandatory rules and guidelines for AI agents
├── ARCHITECTURE.md        # Technical architecture, directory map, and data flows
├── BUSINESS_RULES.md      # Pharmacy domain rules, formulas, and invariants
├── DATA_MODEL.md          # TypeScript entity definitions and schemas
├── UX_GUIDELINES.md       # Visual design system (Strictly Light Mode)
├── PROJECT_STATUS.md      # Implementation audit, known limits, and roadmaps
│
├── .ai/                   # Universal AI Knowledge Base, Skills & Workflows
│   ├── README.md          # AI onboarding guide
│   ├── SKILLS_INDEX.md    # Index of all domain and technical skills
│   ├── skills/            # Modular skill documentation (POS, Inventory, Rx, etc.)
│   └── workflows/         # Step-by-step SOPs (New feature, Bug fix, Refactor, etc.)
│
├── src/
│   ├── components/        # Reusable UI primitives, POS modals, layout shells
│   ├── data/              # Initial seed data fixtures
│   ├── pages/             # Route views (Dashboard, POS, Inventory, Sales, etc.)
│   ├── services/          # LocalStorage-backed domain service singletons
│   ├── store/             # Zustand global stores (usePOSStore, useAppStore)
│   ├── types/             # Shared TypeScript definitions
│   └── utils/             # Formatters, currency, and date utilities
```

---

## AI Assistant Documentation System

This repository contains a universal documentation and skills system designed for AI coding assistants (Gemini, Claude, Cursor, Copilot, ChatGPT, Windsurf, etc.).

When working with an AI assistant on this codebase:
- **First-time AI context**: Point the AI to [AI_CONTEXT.md](./AI_CONTEXT.md) and [AGENTS.md](./AGENTS.md).
- **Domain & Skills index**: Refer to [.ai/SKILLS_INDEX.md](./.ai/SKILLS_INDEX.md).
