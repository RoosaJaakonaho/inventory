import { useState } from 'react'
import { useAuth } from '../lib/auth'
import LocationHome from './LocationHome'
import LocationView from './LocationView'
import Recipes from './Recipes'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('koti') // 'koti', 'mokki', 'reseptit'
  const [locationView, setLocationView] = useState(null) // null = etusivu, 'varasto', 'kauppalista'

  return (
    <div className={styles.wrapper}>
      {/* Header with logout */}
      <header className={styles.header}>
        <button 
          className={styles.logoutBtn}
          onClick={signOut}
          title="Kirjaudu ulos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>

      {/* Main navigation tabs */}
      <nav className={styles.mainNav}>
        <button
          className={`${styles.mainTab} ${activeTab === 'koti' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('koti')
            setLocationView(null)
          }}
        >
          🏠 Koti
        </button>
        <button
          className={`${styles.mainTab} ${activeTab === 'mokki' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('mokki')
            setLocationView(null)
          }}
        >
          🏡 Mökki
        </button>
        <button
          className={`${styles.mainTab} ${activeTab === 'reseptit' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('reseptit')
            setLocationView(null)
          }}
        >
          📖 Reseptit
        </button>
      </nav>

      {/* Sub navigation for Koti/Mökki */}
      {activeTab !== 'reseptit' && (
        <nav className={styles.subNav}>
          <button
            className={`${styles.subTab} ${!locationView ? styles.active : ''}`}
            onClick={() => setLocationView(null)}
          >
            ⚠️ Tarkista
          </button>
          <button
            className={`${styles.subTab} ${locationView === 'varasto' ? styles.active : ''}`}
            onClick={() => setLocationView('varasto')}
          >
            📦 Varasto
          </button>
          <button
            className={`${styles.subTab} ${locationView === 'kauppalista' ? styles.active : ''}`}
            onClick={() => setLocationView('kauppalista')}
          >
            🛒 Kauppalista
          </button>
        </nav>
      )}

      {/* Content */}
      <main className={styles.content}>
        {activeTab === 'koti' && !locationView && (
          <LocationHome locationType="koti" />
        )}
        {activeTab === 'koti' && locationView && (
          <LocationView locationType="koti" activeView={locationView} />
        )}
        {activeTab === 'mokki' && !locationView && (
          <LocationHome locationType="mokki" />
        )}
        {activeTab === 'mokki' && locationView && (
          <LocationView locationType="mokki" activeView={locationView} />
        )}
        {activeTab === 'reseptit' && <Recipes />}
      </main>
    </div>
  )
}
