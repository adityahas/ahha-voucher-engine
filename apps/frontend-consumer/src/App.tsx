import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginView from './pages/LoginView';
import VoucherDashboardView from './pages/VoucherDashboardView';
import MyVouchersView from './pages/MyVouchersView';
import VoucherDetailView from './pages/VoucherDetailView';
import { ProductShowcaseView } from './pages/ProductShowcaseView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Wait for hydration if using persist middleware in production
  
  return (
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
          path="/products"
          element={
            <ProtectedRoute>
              <ProductShowcaseView />
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
