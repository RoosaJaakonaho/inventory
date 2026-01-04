import { useState, useEffect } from 'react'
import { SUB_LOCATIONS, CATEGORIES, getSubLocationFromCategory } from '../lib/supabase'
import styles from './Modal.module.css'

export default function AddShoppingItemModal({ item, onClose, onSave }) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [subLocation, setSubLocation] = useState('pakastin')
  const [category, setCategory] = useState('pakastin_kana')
  const [isKayttotavara, setIsKayttotavara] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setWeight(item.weight || '')
      setIsKayttotavara(item.is_kayttotavara || false)
      if (!item.is_kayttotavara && item.category) {
        const itemSubLocation = getSubLocationFromCategory(item.category)
        setSubLocation(itemSubLocation)
        setCategory(item.category)
      }
    }
  }, [item])

  // When sub-location changes, reset category to first option (only for new items)
  useEffect(() => {
    if (!item && !isKayttotavara) {
      const firstCategory = CATEGORIES[subLocation]?.[0]?.id || ''
      setCategory(firstCategory)
    }
  }, [subLocation, item, isKayttotavara])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isKayttotavara) {
      await onSave({
        name: name.trim(),
        weight: null,
        category: null,
        is_kayttotavara: true,
      })
    } else {
      await onSave({
        name: name.trim(),
        weight: weight.trim() || null,
        category,
        is_kayttotavara: false,
      })
    }

    setLoading(false)
  }

  const currentCategories = CATEGORIES[subLocation] || []
  const isEditing = !!item

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? 'Muokkaa tuotetta' : 'Lisää kauppalistalle'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Käyttötavara toggle */}
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={isKayttotavara}
              onChange={(e) => setIsKayttotavara(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Käyttötavara</span>
          </label>

          <div className={styles.field}>
            <label className="label" htmlFor="name">Nimi *</label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isKayttotavara ? "esim. Tiskiharja" : "esim. Kanafile"}
              required
              autoFocus
            />
          </div>

          {!isKayttotavara && (
            <>
              <div className={styles.field}>
                <label className="label" htmlFor="subLocation">Säilytyspaikka</label>
                <select
                  id="subLocation"
                  className="input"
                  value={subLocation}
                  onChange={(e) => setSubLocation(e.target.value)}
                >
                  {SUB_LOCATIONS.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon} {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className="label" htmlFor="category">Kategoria</label>
                <select
                  id="category"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {currentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className="label" htmlFor="weight">Paino (valinnainen)</label>
                <input
                  id="weight"
                  type="text"
                  className="input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="esim. 500g"
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Peruuta
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Tallennetaan...' : isEditing ? 'Tallenna' : 'Lisää'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}