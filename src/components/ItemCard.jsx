import { memo } from 'react'
import { getCategoryById, getSubLocationById, getSubLocationFromCategory, isInFreezer, isSpice, formatDate, getExpiryStatus, getDaysUntilExpiry } from '../lib/supabase'
import styles from './ItemCard.module.css'

export default memo(function ItemCard({ item, expiryDate, onEdit, onDelete }) {
  const category = getCategoryById(item.category)
  const subLocationId = getSubLocationFromCategory(item.category)
  const subLocation = getSubLocationById(subLocationId)
  const inFreezer = isInFreezer(item.category)
  const isSpiceItem = isSpice(item.category)
  
  const expiryStatus = expiryDate ? getExpiryStatus(expiryDate) : null
  const daysUntil = expiryDate ? getDaysUntilExpiry(expiryDate) : null

  const getExpiryLabel = () => {
    if (daysUntil === null) return null
    if (daysUntil < 0) return `Vanhentunut ${Math.abs(daysUntil)} pv sitten`
    if (daysUntil === 0) return 'Vanhenee tänään'
    if (daysUntil === 1) return 'Vanhenee huomenna'
    if (daysUntil <= 21) return `Vanhenee ${daysUntil} pv`
    return null
  }

  const expiryLabel = getExpiryLabel()
  const needsDate = !isSpiceItem && !expiryDate && (!inFreezer || !item.frozen_date)

  return (
    <div className={`${styles.card} animate-slide-up`}>
      <div className={styles.content}>
        <div className={styles.icon}>{category.icon}</div>
        <div className={styles.info}>
          <div className={styles.header}>
            <h3 className={styles.name}>{item.name}</h3>
            {expiryLabel && (
              <span className={`badge ${expiryStatus === 'expired' || expiryStatus === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                {expiryLabel}
              </span>
            )}
            {needsDate && (
              <span className="badge badge-warning">Lisää päiväys</span>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.subLocation}>{subLocation.icon} {subLocation.name}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.category}>{category.name}</span>
            {item.weight && (
              <>
                <span className={styles.dot}>·</span>
                <span>{item.weight}</span>
              </>
            )}
          </div>
          <div className={styles.dateLine}>
            {inFreezer && item.frozen_date ? (
              <span>Pakastettu: {formatDate(item.frozen_date)}</span>
            ) : !isSpiceItem && expiryDate ? (
              <span>Parasta ennen: {formatDate(expiryDate)}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button 
          className={styles.actionBtn}
          onClick={onEdit}
          title="Muokkaa"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button 
          className={`${styles.actionBtn} ${styles.removeBtn}`}
          onClick={onDelete}
          title="Poista"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
})