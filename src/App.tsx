import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { SalesPage } from './pages/SalesPage';
import { InventoryPage } from './pages/InventoryPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
