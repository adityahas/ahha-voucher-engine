import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { MainLayout } from '../components/layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { UserList } from '../pages/UserList';
import { UserDetail } from '../pages/UserDetail';
import { UserCreate } from '../pages/UserCreate';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
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
        path: '/users/:id',
        element: <UserDetail />,
      },
      {
        path: '/users/create',
        element: <UserCreate />,
      },
      // add more authenticated feature routes here
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
