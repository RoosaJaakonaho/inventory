import { useState } from 'react'
import { useAuth } from '../lib/auth'
import styles from './Login.module.css'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Kirjautuminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="12" fill="currentColor"/>
              <rect x="15" y="20" width="70" height="12" rx="2" fill="#0d0d0d"/>
              <rect x="15" y="38" width="70" height="12" rx="2" fill="#333"/>
              <rect x="15" y="56" width="70" height="12" rx="2" fill="#0d0d0d"/>
              <rect x="15" y="74" width="45" height="12" rx="2" fill="#333"/>
            </svg>
          </div>
          <h1 className={styles.title}>Varasto</h1>
          <p className={styles.subtitle}>Kodin ruokavaraston hallinta</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className="label" htmlFor="email">Sähköposti</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nimi@esimerkki.fi"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className="label" htmlFor="password">Salasana</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
        </form>

        <p className={styles.footer}>
          Pyydä käyttäjätunnus ylläpitäjältä
        </p>
      </div>
    </div>
  )
}