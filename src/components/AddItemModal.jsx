import { useState, useEffect } from 'react'
import { SUB_LOCATIONS, CATEGORIES, isInFreezer, isSpice, getSubLocationFromCategory } from '../lib/supabase'
import styles from './Modal.module.css'

export default function AddItemModal({ item, locationType, onClose, onSave }) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [subLocation, setSubLocation] = useState('')
  const [category, setCategory] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [frozenDate, setFrozenDate] = useState('')
  const [loading, setLoading] = useState(false)

  const subLocations = SUB_LOCATIONS[locationType] || []

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setWeight(item.weight || '')
      const itemSubLocation = getSubLocationFromCategory(item.category)
      setSubLocation(itemSubLocation || subLocations[0]?.id || '')
      setCategory(item.category || '')
      setExpiryDate(item.expiry_date || '')
      setFrozenDate(item.frozen_date || '')
    } else {
      // Default to first sub-location
      const defaultSub = subLocations[0]?.id || ''
      setSubLocation(defaultSub)
      if (defaultSub && CATEGORIES[defaultSub]) {
        setCategory(CATEGORIES[defaultSub][0]?.id || '')
      }
    }
  }, [item, locationType])

  // When sub-location changes, reset category
  useEffect(() => {
    if (!item && subLocation && CATEGORIES[subLocation]) {
      setCategory(CATEGORIES[subLocation][0]?.id || '')
    }
  }, [subLocation, item])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const inFreezer = isInFreezer(category)
    const isSpiceItem = isSpice(category)

    await onSave({
      name: name.trim(),
      weight: weight.trim() || null,
      category,
      expiry_date: (inFreezer || isSpiceItem) ? null : (expiryDate || null),
      frozen_date: inFreezer ? (frozenDate || new Date().toISOString().split('T')[0]) : null,
    })

    setLoading(false)
  }

  const currentCategories = CATEGORIES[subLocation] || []
  const isEditing = !!item
  const inFreezer = isInFreezer(category)
  const isSpiceItem = isSpice(category)
  const showExpiryDate = !inFreezer && !isSpiceItem
  const showFrozenDate = inFreezer

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? 'Muokkaa tuotetta' : 'Lisää tuote'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="label" htmlFor="name">Nimi *</label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="esim. Kanafile"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className="label" htmlFor="subLocation">Säilytyspaikka</label>
            <select
              id="subLocation"
              className="input"
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
            >
              {subLocations.map(sub => (
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
            <label className="label" htmlFor="weight">Määrä</label>
            <input
              id="weight"
              type="text"
              className="input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="esim. 500g"
            />
          </div>

          {showFrozenDate && (
            <div className={styles.field}>
              <label className="label" htmlFor="frozenDate">Pakastuspäivä</label>
              <input
                id="frozenDate"
                type="date"
                className="input"
                value={frozenDate}
                onChange={(e) => setFrozenDate(e.target.value)}
              />
              <p className={styles.hint}>
                🧊 Vanhentuminen lasketaan automaattisesti pakastuspäivästä
              </p>
            </div>
          )}

          {showExpiryDate && (
            <div className={styles.field}>
              <label className="label" htmlFor="expiry">Parasta ennen</label>
              <input
                id="expiry"
                type="date"
                className="input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          )}

          {isSpiceItem && (
            <p className={styles.hint}>
              🧂 Mausteille ei tarvita parasta ennen -päiväystä
            </p>
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
