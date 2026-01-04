import { useState } from 'react'
import { useAuth } from '../lib/auth'
import LocationView from './LocationView'
import Recipes from './Recipes'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('koti') // 'koti', 'mokki', 'reseptit'

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          {activeTab === 'koti' && '🏠 Koti'}
          {activeTab === 'mokki' && '🏡 Mökki'}
          {activeTab === 'reseptit' && '📖 Reseptit'}
        </h1>
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

      {/* Content */}
      <main className={styles.content}>
        {activeTab === 'koti' && <LocationView locationType="koti" />}
        {activeTab === 'mokki' && <LocationView locationType="mokki" />}
        {activeTab === 'reseptit' && <Recipes />}
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <button
          className={`${styles.navBtn} ${activeTab === 'koti' ? styles.active : ''}`}
          onClick={() => setActiveTab('koti')}
        >
          <span className={styles.navIcon}>🏠</span>
          <span className={styles.navLabel}>Koti</span>
        </button>
        <button
          className={`${styles.navBtn} ${activeTab === 'mokki' ? styles.active : ''}`}
          onClick={() => setActiveTab('mokki')}
        >
          <span className={styles.navIcon}>🏡</span>
          <span className={styles.navLabel}>Mökki</span>
        </button>
        <button
          className={`${styles.navBtn} ${activeTab === 'reseptit' ? styles.active : ''}`}
          onClick={() => setActiveTab('reseptit')}
        >
          <span className={styles.navIcon}>📖</span>
          <span className={styles.navLabel}>Reseptit</span>
        </button>
      </nav>
    </div>
  )
}
