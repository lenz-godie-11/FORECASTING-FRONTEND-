import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RouteFallback from './components/RouteFallback.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Analytics = lazy(() => import('./pages/Analytics.jsx'))
const Forecasts = lazy(() => import('./pages/Forecasts.jsx'))
const ResourcePlanning = lazy(() => import('./pages/ResourcePlanning.jsx'))
const Alerts = lazy(() => import('./pages/Alerts.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Help = lazy(() => import('./pages/Help.jsx'))

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="forecasts" element={<Forecasts />} />
            <Route path="resource-planning" element={<ResourcePlanning />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
