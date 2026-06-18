import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Eye, EyeOff, ArrowRight } from 'lucide-react'
import api from '../api/client'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/login', { email, password })
      localStorage.setItem('zk_token', res.data.token)
      localStorage.setItem('zk_user',  JSON.stringify(res.data.user))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.errors?.email?.[0] ?? err.response?.data?.message ?? 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    borderRadius: '10px', border: '1.5px solid #e2e8f0',
    background: '#f8fafc', color: '#0f172a', fontSize: '14px',
    outline: 'none', transition: 'border-color 0.15s',
    ...extra,
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fingerprint size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>ZKPointe</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Gestion des Présences</div>
            </div>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Connexion
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
            Accès réservé au Responsable RH
          </p>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Adresse e-mail
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="rh@zkpointe.local" required autoFocus
                style={inp()}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={inp({ paddingRight: '42px' })}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading
                ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Connexion...</>
                : <><span>Se connecter</span><ArrowRight size={16} /></>
              }
            </button>
          </form>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      <div style={{ width: '420px', background: 'linear-gradient(145deg,#1e1b4b,#312e81)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Fingerprint size={40} color="rgba(255,255,255,0.8)" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Gestion des Présences</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6 }}>
            Système connecté à votre machine ZKTeco pour un suivi en temps réel des pointages.
          </p>
        </div>
      </div>
    </div>
  )
}
