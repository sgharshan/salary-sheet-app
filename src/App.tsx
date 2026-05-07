import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import { initSettings } from './db/database'

export default function App() {
  useEffect(() => { initSettings() }, [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
