import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { MainLayout } from '../components/layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { UserList } from '../pages/UserList';
import { UserDetail } from '../pages/UserDetail';
import { UserCreate } from '../pages/UserCreate';
import { UserEdit } from '../pages/UserEdit';
import { VoucherList } from '../pages/VoucherList';
import { VoucherDetail } from '../pages/VoucherDetail';
import { VoucherCreate } from '../pages/VoucherCreate';
import { VoucherEdit } from '../pages/VoucherEdit';
import { VoucherCategoryList } from '../pages/VoucherCategoryList';
import { VoucherCategoryCreate } from '../pages/VoucherCategoryCreate';
import { VoucherCategoryEdit } from '../pages/VoucherCategoryEdit';
import { VoucherCategoryDetail } from '../pages/VoucherCategoryDetail';
import { ProductList } from '../pages/ProductList';
import { ProductDetail } from '../pages/ProductDetail';
import { ProductCreate } from '../pages/ProductCreate';
import { ProductEdit } from '../pages/ProductEdit';
import { ErrorElement } from '../components/ErrorElement';
import CurrencySettings from '../pages/CurrencySettings';
import TierList from '../pages/TierList';
import TierCreate from '../pages/TierCreate';
import TierEdit from '../pages/TierEdit';
import RewardList from '../pages/RewardList';
import RewardCreate from '../pages/RewardCreate';
import RewardEdit from '../pages/RewardEdit';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    errorElement: <ErrorElement />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      // add more unauthenticated routes here
    ],
  },
  {
    element: <MainLayout />,
    errorElement: <ErrorElement />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/users',
        element: <UserList />,
      },
      {
        path: '/vouchers',
        element: <VoucherList />,
      },
      {
        path: '/vouchers/create',
        element: <VoucherCreate />,
      },
      {
        path: '/vouchers/:code',
        element: <VoucherDetail />,
      },
      {
        path: '/vouchers/:code/edit',
        element: <VoucherEdit />,
      },
      {
        path: '/users/:id',
        element: <UserDetail />,
      },
      {
        path: '/users/create',
        element: <UserCreate />,
      },
      {
        path: '/users/edit/:id',
        element: <UserEdit />,
      },
      {
        path: '/voucher-categories',
        element: <VoucherCategoryList />,
      },
      {
        path: '/voucher-categories/create',
        element: <VoucherCategoryCreate />,
      },
      {
        path: '/voucher-categories/:slug',
        element: <VoucherCategoryDetail />,
      },
      {
        path: '/voucher-categories/:slug/edit',
        element: <VoucherCategoryEdit />,
      },
      {
        path: '/products',
        element: <ProductList />,
      },
      {
        path: '/products/create',
        element: <ProductCreate />,
      },
      {
        path: '/products/:id',
        element: <ProductDetail />,
      },
      {
        path: '/products/:id/edit',
        element: <ProductEdit />,
      },
      {
        path: '/settings/currency',
        element: <CurrencySettings />,
      },
      {
        path: '/tiers',
        element: <TierList />,
      },
      {
        path: '/tiers/create',
        element: <TierCreate />,
      },
      {
        path: '/tiers/:id/edit',
        element: <TierEdit />,
      },
      {
        path: '/rewards',
        element: <RewardList />,
      },
      {
        path: '/rewards/create',
        element: <RewardCreate />,
      },
      {
        path: '/rewards/:id/edit',
        element: <RewardEdit />,
      },
      // add more authenticated feature routes here
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
