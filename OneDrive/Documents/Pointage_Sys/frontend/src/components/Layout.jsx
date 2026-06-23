import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

export default function Layout() {
  const { t } = useTheme()
  const { lang } = useLang()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, flexDirection: lang==='ar' ? 'row-reverse' : 'row' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
