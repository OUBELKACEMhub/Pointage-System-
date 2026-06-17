import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout     from './components/Layout'
import Dashboard  from './pages/Dashboard'
import Employees  from './pages/Employees'
import Attendance from './pages/Attendance'
import Schedules  from './pages/Schedules'
import Reports    from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index            element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance"element={<Attendance />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="reports"   element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
