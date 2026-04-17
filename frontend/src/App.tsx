import { Routes, Route, Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import MainLayout from './layouts/MainLayout.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import NewsFeedPage from './pages/NewsFeedPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import FriendsPage from './pages/FriendsPage.tsx'
import GroupsPage from './pages/GroupsPage.tsx'
import GroupDetailPage from './pages/GroupDetailPage.tsx'
import AdminUsersPage from './pages/AdminUsersPage.tsx'
import UserManagementPage from './pages/UserManagementPage.tsx'
import AnalyticsPage from './pages/AnalyticsPage.tsx'
import ReportsPage from './pages/ReportsPage.tsx'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index                    element={<NewsFeedPage />} />
          <Route path="profile/:userId"   element={<ProfilePage />} />
          <Route path="friends"           element={<FriendsPage />} />
          <Route path="groups"            element={<GroupsPage />} />
          <Route path="groups/:groupId"   element={<GroupDetailPage />} />
          <Route path="admin/users"       element={<AdminUsersPage />} />
          <Route path="users"             element={<UserManagementPage />} />
          <Route path="analytics"         element={<AnalyticsPage />} />
          <Route path="reports"          element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
