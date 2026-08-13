import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginView from './pages/LoginView';
import VoucherDashboardView from './pages/VoucherDashboardView';
import MyVouchersView from './pages/MyVouchersView';
import VoucherDetailView from './pages/VoucherDetailView';
import PointsHistoryView from './pages/PointsHistoryView';
import LoyaltyView from './pages/LoyaltyView';
import RewardsView from './pages/RewardsView';
import { ProductShowcaseView } from './pages/ProductShowcaseView';
import { CheckoutView } from './pages/CheckoutView';
import { CurrencySettingsProvider } from './context/currency-settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <CurrencySettingsProvider>
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
            path="/points-history"
            element={
              <ProtectedRoute>
                <PointsHistoryView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                <LoyaltyView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsView />
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
    </CurrencySettingsProvider>
  );
}

export default App;
