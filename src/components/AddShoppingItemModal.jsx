import { useState, useEffect } from 'react'
import { SUB_LOCATIONS, CATEGORIES, getSubLocationFromCategory, isInFreezer, isSpice } from '../lib/supabase'
import styles from './Modal.module.css'

export default function AddShoppingItemModal({ item, locationType, onClose, onSave }) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [subLocation, setSubLocation] = useState('')
  const [category, setCategory] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [frozenDate, setFrozenDate] = useState('')
  const [isNonInventory, setIsNonInventory] = useState(false)
  const [loading, setLoading] = useState(false)

  const subLocations = SUB_LOCATIONS[locationType] || []

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setWeight(item.weight || '')
      setIsNonInventory(item.is_non_inventory || false)
      setExpiryDate(item.expiry_date || '')
      setFrozenDate(item.frozen_date || '')
      if (!item.is_non_inventory && item.category) {
        const itemSubLocation = getSubLocationFromCategory(item.category)
        setSubLocation(itemSubLocation || subLocations[0]?.id || '')
        setCategory(item.category)
      } else {
        setSubLocation(subLocations[0]?.id || '')
        setCategory(CATEGORIES[subLocations[0]?.id]?.[0]?.id || '')
      }
    } else {
      const defaultSub = subLocations[0]?.id || ''
      setSubLocation(defaultSub)
      if (defaultSub && CATEGORIES[defaultSub]) {
        setCategory(CATEGORIES[defaultSub][0]?.id || '')
      }
    }
  }, [item, locationType])

  // When sub-location changes, reset category
  useEffect(() => {
    if (!item && !isNonInventory && subLocation && CATEGORIES[subLocation]) {
      setCategory(CATEGORIES[subLocation][0]?.id || '')
    }
  }, [subLocation, item, isNonInventory])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isNonInventory) {
      await onSave({
        name: name.trim(),
        weight: null,
        category: null,
        expiry_date: null,
        frozen_date: null,
        is_non_inventory: true,
      })
    } else {
      const inFreezer = isInFreezer(category)
      const isSpiceItem = isSpice(category)
      
      await onSave({
        name: name.trim(),
        weight: weight.trim() || null,
        category,
        expiry_date: (inFreezer || isSpiceItem) ? null : (expiryDate || null),
        frozen_date: inFreezer ? (frozenDate || null) : null,
        is_non_inventory: false,
      })
    }

    setLoading(false)
  }

  const currentCategories = CATEGORIES[subLocation] || []
  const isEditing = !!item
  const inFreezer = !isNonInventory && isInFreezer(category)
  const isSpiceItem = !isNonInventory && isSpice(category)
  const showExpiryDate = !isNonInventory && !inFreezer && !isSpiceItem
  const showFrozenDate = !isNonInventory && inFreezer

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
          {/* Non-inventory toggle */}
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={isNonInventory}
              onChange={(e) => setIsNonInventory(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Ei inventaarioon</span>
          </label>

          <div className={styles.field}>
            <label className="label" htmlFor="name">Nimi *</label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isNonInventory ? "esim. Tiskiharja" : "esim. Kanafile"}
              required
              autoFocus
            />
          </div>

          {!isNonInventory && (
            <>
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
                <label className="label" htmlFor="weight">Määrä (valinnainen)</label>
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
                  <label className="label" htmlFor="frozenDate">Pakastuspäivä (valinnainen)</label>
                  <input
                    id="frozenDate"
                    type="date"
                    className="input"
                    value={frozenDate}
                    onChange={(e) => setFrozenDate(e.target.value)}
                  />
                  <p className={styles.hint}>
                    🧊 Voit lisätä pakastuspäivän kaupassa tai jättää tyhjäksi
                  </p>
                </div>
              )}

              {showExpiryDate && (
                <div className={styles.field}>
                  <label className="label" htmlFor="expiry">Parasta ennen (valinnainen)</label>
                  <input
                    id="expiry"
                    type="date"
                    className="input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <p className={styles.hint}>
                    📅 Voit lisätä päiväyksen kaupassa tai jättää tyhjäksi
                  </p>
                </div>
              )}
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
