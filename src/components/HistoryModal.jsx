import { useState, useEffect } from 'react'
import { supabase, formatDate } from '../lib/supabase'
import styles from './Modal.module.css'
import historyStyles from './HistoryModal.module.css'

export default function HistoryModal({ locationId, onClose, onRestore }) {
  const [history, setHistory] = useState([])
  const [removedItems, setRemovedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('history')

  useEffect(() => {
    fetchData()
  }, [locationId])

  const fetchData = async () => {
    // Fetch history
    const { data: historyData } = await supabase
      .from('history')
      .select('*, items(name)')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(50)

    setHistory(historyData || [])

    // Fetch removed items
    const { data: removedData } = await supabase
      .from('items')
      .select('*')
      .eq('location_id', locationId)
      .eq('in_stock', false)
      .order('updated_at', { ascending: false })
      .limit(20)

    setRemovedItems(removedData || [])
    setLoading(false)
  }

  const handleRestore = async (item) => {
    await onRestore(item)
    fetchData()
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Juuri nyt'
    if (diffMins < 60) return `${diffMins} min sitten`
    if (diffHours < 24) return `${diffHours} t sitten`
    if (diffDays < 7) return `${diffDays} pv sitten`
    return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'added': return '➕'
      case 'removed': return '🗑️'
      case 'updated': return '✏️'
      case 'restored': return '♻️'
      default: return '•'
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.large}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Toiminta</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={historyStyles.tabs}>
          <button 
            className={`${historyStyles.tab} ${tab === 'history' ? historyStyles.active : ''}`}
            onClick={() => setTab('history')}
          >
            Historia
          </button>
          <button 
            className={`${historyStyles.tab} ${tab === 'removed' ? historyStyles.active : ''}`}
            onClick={() => setTab('removed')}
          >
            Poistetut
            {removedItems.length > 0 && (
              <span className={historyStyles.count}>{removedItems.length}</span>
            )}
          </button>
        </div>

        <div className={historyStyles.content}>
          {loading ? (
            <div className={historyStyles.loading}>Ladataan...</div>
          ) : tab === 'history' ? (
            history.length === 0 ? (
              <div className={historyStyles.empty}>Ei toimintaa vielä</div>
            ) : (
              <div className={historyStyles.list}>
                {history.map(entry => (
                  <div key={entry.id} className={historyStyles.entry}>
                    <div className={historyStyles.entryIcon}>
                      {getActionIcon(entry.action)}
                    </div>
                    <div className={historyStyles.entryContent}>
                      <p className={historyStyles.entryText}>{entry.details}</p>
                      <p className={historyStyles.entryMeta}>
                        {entry.user_email?.split('@')[0]} · {formatTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            removedItems.length === 0 ? (
              <div className={historyStyles.empty}>Ei poistettuja tuotteita</div>
            ) : (
              <div className={historyStyles.list}>
                {removedItems.map(item => (
                  <div key={item.id} className={historyStyles.removedItem}>
                    <div>
                      <p className={historyStyles.itemName}>{item.name}</p>
                      <p className={historyStyles.entryMeta}>
                        Poistettu {formatTime(item.updated_at)}
                      </p>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRestore(item)}
                    >
                      Palauta
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}