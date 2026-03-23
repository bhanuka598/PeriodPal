import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { MenstrualRecords } from '../pages/MenstrualRecords';
import { ProductRequests } from '../pages/ProductRequests';
import { Inventory } from '../pages/Inventory';
import { Donations } from '../pages/Donations';
import { UsersManagement } from '../pages/UsersManagement';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        {/* Role-based routes */}
        <Route
          path="/records"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <MenstrualRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={['user', 'ngo', 'admin']}>
              <ProductRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['ngo', 'admin']}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route path="/donations" element={<Donations />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}