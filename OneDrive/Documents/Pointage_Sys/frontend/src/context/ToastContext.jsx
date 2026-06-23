import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X, UserCheck, Clock, AlertCircle } from 'lucide-react'
import { useTheme } from './ThemeContext'

const ToastContext = createContext(null)

let nextId = 0

const ICONS = {
  punch:   UserCheck,
  warning: AlertCircle,
  info:    Clock,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const addToast = useCallback((msg, type = 'punch', duration = 5000) => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-4), { id, msg, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, dismiss }) {
  const { t, dark } = useTheme()
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '320px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} dismiss={dismiss} t={t} dark={dark} />
      ))}
    </div>
  )
}

function ToastItem({ toast, dismiss, t, dark }) {
  const colors = {
    punch:   { bg: '#16a34a', icon: '#16a34a', border: '#16a34a30' },
    warning: { bg: '#d97706', icon: '#d97706', border: '#d9770630' },
    info:    { bg: '#6366f1', icon: '#6366f1', border: '#6366f130' },
  }
  const c   = colors[toast.type] || colors.info
  const Icon = ICONS[toast.type] || Clock

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 16px',
      borderRadius: '12px',
      background: t.surface,
      border: `1px solid ${c.border}`,
      boxShadow: dark
        ? '0 8px 32px rgba(0,0,0,0.5)'
        : '0 8px 32px rgba(0,0,0,0.12)',
      pointerEvents: 'all',
      animation: 'toast-in 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent bar */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:c.bg, borderRadius:'12px 0 0 12px' }}/>

      {/* Icon */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: c.bg + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={c.icon} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: t.text, lineHeight: 1.4 }}>
          {toast.msg.title}
        </div>
        {toast.msg.body && (
          <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>
            {toast.msg.body}
          </div>
        )}
      </div>

      {/* Close */}
      <button onClick={() => dismiss(toast.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '2px', color: t.textFaint, flexShrink: 0,
        display: 'flex', alignItems: 'center',
      }}>
        <X size={14} />
      </button>
    </div>
  )
}

export const useToast = () => useContext(ToastContext)
