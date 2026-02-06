import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Layout from './components/layout/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import TeamDetails from './pages/TeamDetails'
import ClientOfMonth from './pages/ClientOfMonth'
import LeaveApproval from './pages/LeaveApproval'
import MyLeaves from './pages/MyLeaves'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-red">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading GROFAST...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/team" element={<TeamDetails />} />
        <Route path="/client-of-month" element={<ClientOfMonth />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />

        {/* Employee Only Routes */}
        <Route path="/my-leaves" element={<MyLeaves />} />

        {/* Admin Only Routes */}
        <Route
          path="/leaves"
          element={
            <AdminRoute>
              <LeaveApproval />
            </AdminRoute>
          }
        />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
