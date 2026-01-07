import { useState } from 'react'
import { supabase, getRecipeCategoryById, getCategoryById, getMaxAmount } from '../lib/supabase'
import styles from './RecipeDetailModal.module.css'
import modalStyles from './Modal.module.css'

export default function RecipeDetailModal({ recipe, onClose, onEdit }) {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [targetLocation, setTargetLocation] = useState('koti')
  const [adding, setAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
      // Use max value from range (e.g. "2-3" -> "3")
      const maxAmount = getMaxAmount(ing.amount)
      
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
                      {ing.amount && (
                        <span className={styles.ingAmount}>
                          {ing.amount} {ing.unit || ''}
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