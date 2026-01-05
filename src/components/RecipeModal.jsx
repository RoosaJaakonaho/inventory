import { useState, useEffect, useRef } from 'react'
import { RECIPE_CATEGORIES, SUB_LOCATIONS, CATEGORIES, getCategoryById } from '../lib/supabase'
import styles from './RecipeModal.module.css'
import modalStyles from './Modal.module.css'

export default function RecipeModal({ recipe, onClose, onSave }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)

  // New ingredient form
  const [newIngName, setNewIngName] = useState('')
  const [newIngAmount, setNewIngAmount] = useState('')
  const [newIngSubLocation, setNewIngSubLocation] = useState('pakastin')
  const [newIngCategory, setNewIngCategory] = useState('pakastin_kana')
  const ingredientInputRef = useRef(null)

  useEffect(() => {
    if (recipe) {
      setName(recipe.name || '')
      setCategory(recipe.category || '')
      setInstructions(recipe.instructions || '')
      setIngredients(recipe.recipe_ingredients || [])
    }
  }, [recipe])

  // Update category when sub-location changes
  useEffect(() => {
    if (CATEGORIES[newIngSubLocation]) {
      setNewIngCategory(CATEGORIES[newIngSubLocation][0]?.id || '')
    }
  }, [newIngSubLocation])

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return

    const newIngredient = {
      name: newIngName.trim(),
      amount: newIngAmount.trim() || null,
      sub_location: newIngSubLocation,
      category: newIngCategory,
    }

    setIngredients([...ingredients, newIngredient])
    setNewIngName('')
    setNewIngAmount('')
    
    // Focus back to ingredient name input
    ingredientInputRef.current?.focus()
  }

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    await onSave(
      {
        name: name.trim(),
        category: category || null,
        instructions: instructions.trim() || null,
      },
      ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        sub_location: ing.sub_location,
        category: ing.category,
      }))
    )

    setLoading(false)
  }

  const isEditing = !!recipe
  const currentCategories = CATEGORIES[newIngSubLocation] || []

  // Use all sub-locations for ingredients (from koti since it has all)
  const allSubLocations = SUB_LOCATIONS.koti

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={`${modalStyles.modal} ${styles.recipeModal}`} onClick={e => e.stopPropagation()}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>{isEditing ? 'Muokkaa reseptiä' : 'Lisää resepti'}</h2>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={modalStyles.field}>
            <label className="label" htmlFor="name">Nimi *</label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="esim. Kanawokki"
              required
            />
          </div>

          <div className={modalStyles.field}>
            <label className="label" htmlFor="category">Kategoria</label>
            <select
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Ei kategoriaa</option>
              {RECIPE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className="label" htmlFor="instructions">Ohjeet</label>
            <textarea
              id="instructions"
              className={`input ${styles.textarea}`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Kirjoita ohjeet tähän..."
              rows={4}
            />
          </div>

          {/* Ingredients section */}
          <div className={styles.ingredientsSection}>
            <label className="label">Ainesosat</label>
            
            {ingredients.length > 0 && (
              <div className={styles.ingredientsList}>
                {ingredients.map((ing, idx) => {
                  const cat = getCategoryById(ing.category)
                  return (
                    <div key={idx} className={styles.ingredientItem}>
                      <span className={styles.ingredientIcon}>{cat.icon}</span>
                      <span className={styles.ingredientName}>
                        {ing.name}
                        {ing.amount && <span className={styles.ingredientAmount}> ({ing.amount})</span>}
                      </span>
                      <button 
                        type="button"
                        className={styles.removeIngBtn}
                        onClick={() => handleRemoveIngredient(idx)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add ingredient form */}
            <div className={styles.addIngredient}>
              <div className={styles.ingRow}>
                <input
                  ref={ingredientInputRef}
                  type="text"
                  className="input"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="Ainesosa"
                />
                <input
                  type="text"
                  className={`input ${styles.amountInput}`}
                  value={newIngAmount}
                  onChange={(e) => setNewIngAmount(e.target.value)}
                  placeholder="Määrä"
                />
              </div>
              <div className={styles.ingRow}>
                <select
                  className="input"
                  value={newIngSubLocation}
                  onChange={(e) => setNewIngSubLocation(e.target.value)}
                >
                  {allSubLocations.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon} {sub.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={newIngCategory}
                  onChange={(e) => setNewIngCategory(e.target.value)}
                >
                  {currentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddIngredient}
                disabled={!newIngName.trim()}
              >
                + Lisää ainesosa
              </button>
            </div>
          </div>

          <div className={modalStyles.actions}>
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