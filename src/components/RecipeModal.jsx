import { useState, useEffect, useRef } from 'react'
import { RECIPE_CATEGORIES, SUB_LOCATIONS, CATEGORIES, UNITS, getCategoryById } from '../lib/supabase'
import styles from './RecipeModal.module.css'
import modalStyles from './Modal.module.css'

export default function RecipeModal({ recipe, onClose, onSave }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)

  // New ingredient form - order: amount, unit, name, storage
  const [newIngAmount, setNewIngAmount] = useState('')
  const [newIngUnit, setNewIngUnit] = useState('kpl')
  const [newIngName, setNewIngName] = useState('')
  const [newIngSubLocation, setNewIngSubLocation] = useState('pakastin')
  const [newIngCategory, setNewIngCategory] = useState('pakastin_kana')
  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null)
  const amountInputRef = useRef(null)

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
      unit: newIngUnit || null,
      sub_location: newIngSubLocation,
      category: newIngCategory,
    }

    if (editingIngredientIndex !== null) {
      // Update existing ingredient
      const updated = [...ingredients]
      updated[editingIngredientIndex] = newIngredient
      setIngredients(updated)
      setEditingIngredientIndex(null)
    } else {
      // Add new ingredient
      setIngredients([...ingredients, newIngredient])
    }
    
    setNewIngAmount('')
    setNewIngUnit('kpl')
    setNewIngName('')
    
    // Focus back to amount input
    amountInputRef.current?.focus()
  }

  const handleEditIngredient = (index) => {
    const ing = ingredients[index]
    setNewIngAmount(ing.amount || '')
    setNewIngUnit(ing.unit || 'kpl')
    setNewIngName(ing.name)
    setNewIngSubLocation(ing.sub_location)
    setNewIngCategory(ing.category)
    setEditingIngredientIndex(index)
    amountInputRef.current?.focus()
  }

  const handleCancelEdit = () => {
    setEditingIngredientIndex(null)
    setNewIngAmount('')
    setNewIngUnit('kpl')
    setNewIngName('')
  }

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
    if (editingIngredientIndex === index) {
      setEditingIngredientIndex(null)
      setNewIngName('')
      setNewIngAmount('')
    }
  }

  const handleMoveIngredient = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= ingredients.length) return
    
    const updated = [...ingredients]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)
    setIngredients(updated)
    
    // Update editing index if needed
    if (editingIngredientIndex === index) {
      setEditingIngredientIndex(newIndex)
    } else if (editingIngredientIndex === newIndex) {
      setEditingIngredientIndex(index)
    }
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
        unit: ing.unit,
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
                  const isEditing = editingIngredientIndex === idx
                  const isFirst = idx === 0
                  const isLast = idx === ingredients.length - 1
                  return (
                    <div key={idx} className={`${styles.ingredientItem} ${isEditing ? styles.editing : ''}`}>
                      <div className={styles.moveButtons}>
                        <button 
                          type="button"
                          className={styles.moveBtn}
                          onClick={() => handleMoveIngredient(idx, -1)}
                          disabled={isFirst}
                          title="Siirrä ylös"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        </button>
                        <button 
                          type="button"
                          className={styles.moveBtn}
                          onClick={() => handleMoveIngredient(idx, 1)}
                          disabled={isLast}
                          title="Siirrä alas"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>
                      <span className={styles.ingredientIcon}>{cat.icon}</span>
                      {ing.amount && (
                        <span className={styles.ingredientAmount}>
                          {ing.amount} {ing.unit || ''}
                        </span>
                      )}
                      <span className={styles.ingredientName}>{ing.name}</span>
                      <button 
                        type="button"
                        className={styles.editIngBtn}
                        onClick={() => handleEditIngredient(idx)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
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
                  ref={amountInputRef}
                  type="text"
                  className={`input ${styles.amountInput}`}
                  value={newIngAmount}
                  onChange={(e) => setNewIngAmount(e.target.value)}
                  placeholder="1-2"
                />
                <select
                  className={`input ${styles.unitSelect}`}
                  value={newIngUnit}
                  onChange={(e) => setNewIngUnit(e.target.value)}
                >
                  {UNITS.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="Ainesosa"
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
              <div className={styles.ingActions}>
                {editingIngredientIndex !== null && (
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelEdit}
                  >
                    Peruuta
                  </button>
                )}
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddIngredient}
                  disabled={!newIngName.trim()}
                >
                  {editingIngredientIndex !== null ? '✓ Tallenna' : '+ Lisää ainesosa'}
                </button>
              </div>
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
