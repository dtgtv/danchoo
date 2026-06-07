import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import MapPage from './pages/MapPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import { LoginPage, DashboardPage, PropertyFormPage } from './pages/AgentPages'
import './index.css'

function RequireAgent({ children }) {
  const { agent, loading } = useAuth()
  if (loading) return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>
  if (!agent) return <Navigate to="/login" replace />
  return children
}

function RequireNoAuth({ children }) {
  const { agent, loading } = useAuth()
  if (loading) return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>
  if (agent) return <Navigate to="/agent" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/agent" element={<RequireAgent><DashboardPage /></RequireAgent>} />
      <Route path="/agent/property/new" element={<RequireAgent><PropertyFormPage /></RequireAgent>} />
      <Route path="/agent/property/:id/edit" element={<RequireAgent><PropertyFormPage /></RequireAgent>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/danchoo">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}