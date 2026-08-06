import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginView from './pages/LoginView';
import VoucherDashboardView from './pages/VoucherDashboardView';
import MyVouchersView from './pages/MyVouchersView';
import VoucherDetailView from './pages/VoucherDetailView';
import { ProductShowcaseView } from './pages/ProductShowcaseView';
import { CheckoutView } from './pages/CheckoutView';
import { getCurrencySettings } from './api/settings';
import { CurrencyProvider } from './context/CurrencyContext';
import {
  DEFAULT_CURRENCY_SETTINGS,
  type CurrencySettings,
} from './types/currency-settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(
    DEFAULT_CURRENCY_SETTINGS,
  );
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    getCurrencySettings()
      .then(setCurrencySettings)
      .catch(() => setSettingsError(true));
  }, []);

  return (
    <CurrencyProvider settings={currencySettings}>
      {settingsError && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-amber-500/90 px-4 py-2 text-sm text-black shadow-lg">
          Using default currency formatting
        </div>
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <VoucherDashboardView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-vouchers"
            element={
              <ProtectedRoute>
                <MyVouchersView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vouchers/:code"
            element={
              <ProtectedRoute>
                <VoucherDetailView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <ProtectedRoute>
                <CheckoutView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductShowcaseView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  );
}

export default App;
