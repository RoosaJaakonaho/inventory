import { useState } from 'react'
import { supabase, getRecipeCategoryById, getCategoryById, getMaxAmount } from '../lib/supabase'
import styles from './RecipeDetailModal.module.css'
import modalStyles from './Modal.module.css'

// Scale an amount string (handles ranges like "2-3" and decimals)
const scaleAmount = (amount, scale) => {
  if (!amount) return null
  const str = String(amount).trim()

  if (str.includes('-')) {
    // Handle range like "2-3"
    const parts = str.split('-')
    const scaled = parts.map(p => {
      const num = parseFloat(p.trim())
      if (isNaN(num)) return p.trim()
      const result = num * scale
      return Number.isInteger(result) ? result : result.toFixed(1).replace(/\.0$/, '')
    })
    return scaled.join('-')
  }

  const num = parseFloat(str)
  if (isNaN(num)) return str
  const result = num * scale
  return Number.isInteger(result) ? String(result) : result.toFixed(1).replace(/\.0$/, '')
}

export default function RecipeDetailModal({ recipe, onClose, onEdit }) {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [targetLocation, setTargetLocation] = useState('koti')
  const [adding, setAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [scale, setScale] = useState(1)

  const category = getRecipeCategoryById(recipe.category)
  const ingredients = recipe.recipe_ingredients || []

  const toggleIngredient = (ingredientId) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    )
  }

  const selectAllIngredients = () => {
    if (selectedIngredients.length === ingredients.length) {
      setSelectedIngredients([])
    } else {
      setSelectedIngredients(ingredients.map(ing => ing.id))
    }
  }

  const handleAddToShoppingList = async () => {
    if (selectedIngredients.length === 0) return

    setAdding(true)

    const ingredientsToAdd = ingredients.filter(ing => selectedIngredients.includes(ing.id))

    for (const ing of ingredientsToAdd) {
      // Scale the amount and use max value from range (e.g. "2-3" -> "3")
      const scaledAmount = scaleAmount(ing.amount, scale)
      const maxAmount = getMaxAmount(scaledAmount)

      await supabase
        .from('shopping_list')
        .insert([{
          location_type: targetLocation,
          name: ing.name,
          category: ing.category,
          amount: maxAmount,
          unit: ing.unit,
          checked: false,
          is_non_inventory: false,
        }])
    }

    setAdding(false)
    setShowSuccess(true)
    setSelectedIngredients([])

    setTimeout(() => {
      setShowSuccess(false)
    }, 2000)
  }

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={`${modalStyles.modal} ${styles.detailModal}`} onClick={e => e.stopPropagation()}>
        <div className={modalStyles.header}>
          <div className={styles.headerContent}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            <div>
              <h2 className={styles.title}>{recipe.name}</h2>
              <span className={styles.categoryName}>{category.name}</span>
            </div>
          </div>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Instructions */}
          {recipe.instructions && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📝 Ohjeet</h3>
              <p className={styles.instructions}>{recipe.instructions}</p>
            </div>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>🥗 Ainesosat</h3>
                <div className={styles.scaleButtons}>
                  <button
                    className={`${styles.scaleBtn} ${scale === 0.5 ? styles.active : ''}`}
                    onClick={() => setScale(0.5)}
                  >
                    ½×
                  </button>
                  <button
                    className={`${styles.scaleBtn} ${scale === 1 ? styles.active : ''}`}
                    onClick={() => setScale(1)}
                  >
                    1×
                  </button>
                  <button
                    className={`${styles.scaleBtn} ${scale === 2 ? styles.active : ''}`}
                    onClick={() => setScale(2)}
                  >
                    2×
                  </button>
                </div>
              </div>
              <div className={styles.selectAllRow}>
                <button
                  className={styles.selectAllBtn}
                  onClick={selectAllIngredients}
                >
                  {selectedIngredients.length === ingredients.length ? 'Poista valinnat' : 'Valitse kaikki'}
                </button>
              </div>
              
              <div className={styles.ingredientsList}>
                {ingredients.map(ing => {
                  const cat = getCategoryById(ing.category)
                  const isSelected = selectedIngredients.includes(ing.id)
                  const scaledAmount = scaleAmount(ing.amount, scale)
                  return (
                    <div
                      key={ing.id}
                      className={`${styles.ingredientItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleIngredient(ing.id)}
                    >
                      <div className={styles.checkbox}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <span className={styles.ingIcon}>{cat.icon}</span>
                      {scaledAmount && (
                        <span className={styles.ingAmount}>
                          {scaledAmount} {ing.unit || ''}
                        </span>
                      )}
                      <span className={styles.ingName}>{ing.name}</span>
                    </div>
                  )
                })}
              </div>

              {/* Add to shopping list */}
              {selectedIngredients.length > 0 && (
                <div className={styles.addToList}>
                  <select
                    className="input"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                  >
                    <option value="koti">🏠 Kodin kauppalista</option>
                    <option value="mokki">🏡 Mökin kauppalista</option>
                  </select>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddToShoppingList}
                    disabled={adding}
                  >
                    {adding ? 'Lisätään...' : `Lisää kauppalistalle (${selectedIngredients.length})`}
                  </button>
                </div>
              )}

              {showSuccess && (
                <div className={styles.successMessage}>
                  ✅ Ainekset lisätty kauppalistalle!
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className="btn btn-secondary" onClick={onEdit}>
            ✏️ Muokkaa reseptiä
          </button>
        </div>
      </div>
    </div>
  )
}
