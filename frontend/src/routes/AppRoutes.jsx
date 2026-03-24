import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { MenstrualRecords } from '../pages/MenstrualRecords';
import { Inventory } from '../pages/Inventory';
import { Donations } from '../pages/Donations';
import { UsersManagement } from '../pages/UsersManagement';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected system routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/records"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <MenstrualRecords />
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

        <Route
          path="/donations"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <Donations />
            </ProtectedRoute>
          }
        />

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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}