import { Navigate, Outlet } from 'react-router-dom'

export default function PrivateRoute() {
  const token = localStorage.getItem('zk_token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
