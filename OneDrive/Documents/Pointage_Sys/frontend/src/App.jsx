import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import Layout       from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Employees    from './pages/Employees'
import Attendance   from './pages/Attendance'
import Schedules    from './pages/Schedules'
import Reports      from './pages/Reports'
import Leaves           from './pages/Leaves'
import Justifications  from './pages/Justifications'
import EmployeeProfile from './pages/EmployeeProfile'

export default function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route index             element={<Dashboard />} />
              <Route path="employees"  element={<Employees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedules"  element={<Schedules />} />
              <Route path="reports"    element={<Reports />} />
              <Route path="leaves"             element={<Leaves />} />
              <Route path="justifications"    element={<Justifications />} />
              <Route path="employees/:id"     element={<EmployeeProfile />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </ThemeProvider>
    </LanguageProvider>
  )
}
