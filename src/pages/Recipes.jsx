import { useState, useEffect, useMemo } from 'react'
import { supabase, RECIPE_CATEGORIES, getRecipeCategoryById } from '../lib/supabase'
import RecipeModal from '../components/RecipeModal'
import RecipeDetailModal from '../components/RecipeDetailModal'
import ConfirmModal from '../components/ConfirmModal'
import styles from './Recipes.module.css'

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [viewingRecipe, setViewingRecipe] = useState(null)
  const [deleteRecipe, setDeleteRecipe] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching recipes:', error)
      return
    }

    setRecipes(data || [])
    setLoading(false)
  }

  const handleSaveRecipe = async (recipeData, ingredients) => {
    if (editingRecipe) {
      // Update existing recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', editingRecipe.id)

      if (recipeError) {
        console.error('Error updating recipe:', recipeError)
        return
      }

      // Delete old ingredients and insert new ones
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', editingRecipe.id)

      if (ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ing, idx) => ({
          ...ing,
          recipe_id: editingRecipe.id,
          sort_order: idx,
        }))

        await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId)
      }
    } else {
      // Create new recipe
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single()

      if (error) {
        console.error('Error adding recipe:', error)
        return
      }

      // Add ingredients
      if (ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ing, idx) => ({
          ...ing,
          recipe_id: data.id,
          sort_order: idx,
        }))

        await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId)
      }
    }

    fetchRecipes()
    setShowAddModal(false)
    setEditingRecipe(null)
  }

  const handleDeleteRecipe = async () => {
    if (!deleteRecipe) return

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', deleteRecipe.id)

    if (error) {
      console.error('Error deleting recipe:', error)
      return
    }

    setDeleteRecipe(null)
    fetchRecipes()
  }

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !filterCategory || recipe.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Group recipes by first letter when showing all (no category filter)
  const { groupedRecipes, availableLetters } = useMemo(() => {
    if (filterCategory || searchQuery) {
      return { groupedRecipes: null, availableLetters: [] }
    }

    const groups = {}
    filteredRecipes.forEach(recipe => {
      const firstLetter = recipe.name.charAt(0).toUpperCase()
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(recipe)
    })

    const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'fi'))
    return { groupedRecipes: groups, availableLetters: letters }
  }, [filteredRecipes, filterCategory, searchQuery])

  const scrollToLetter = (letter) => {
    const element = document.getElementById(`letter-${letter}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Search and filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Hae reseptejä..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${!filterCategory ? styles.active : ''}`}
            onClick={() => setFilterCategory('')}
          >
            Kaikki
          </button>
          {RECIPE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryTab} ${filterCategory === cat.id ? styles.active : ''}`}
              onClick={() => setFilterCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Letter jump bar */}
      {availableLetters.length > 1 && (
        <div className={styles.letterBar}>
          {availableLetters.map(letter => (
            <button
              key={letter}
              className={styles.letterBtn}
              onClick={() => scrollToLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* Recipes list */}
      <div className={styles.mainContent}>
        {filteredRecipes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📖</div>
            <p>{searchQuery || filterCategory ? 'Ei hakua vastaavia reseptejä' : 'Ei reseptejä vielä'}</p>
            {!searchQuery && !filterCategory && (
              <button
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => setShowAddModal(true)}
              >
                Lisää ensimmäinen resepti
              </button>
            )}
          </div>
        ) : groupedRecipes ? (
          /* Grouped by letter view */
          <div className={styles.recipesList}>
            {availableLetters.map(letter => (
              <div key={letter} className={styles.letterGroup}>
                <div id={`letter-${letter}`} className={styles.letterHeader}>
                  {letter}
                </div>
                {groupedRecipes[letter].map(recipe => {
                  const category = getRecipeCategoryById(recipe.category)
                  return (
                    <div
                      key={recipe.id}
                      className={styles.recipeCard}
                      onClick={() => setViewingRecipe(recipe)}
                    >
                      <div className={styles.recipeIcon}>{category.icon}</div>
                      <div className={styles.recipeInfo}>
                        <h3 className={styles.recipeName}>{recipe.name}</h3>
                        <span className={styles.recipeCategory}>{category.name}</span>
                      </div>
                      <div className={styles.recipeActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRecipe(recipe)
                            setShowAddModal(true)
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteRecipe(recipe)
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Flat list view (when filtered by category or search) */
          <div className={styles.recipesList}>
            {filteredRecipes.map(recipe => {
              const category = getRecipeCategoryById(recipe.category)
              return (
                <div
                  key={recipe.id}
                  className={styles.recipeCard}
                  onClick={() => setViewingRecipe(recipe)}
                >
                  <div className={styles.recipeIcon}>{category.icon}</div>
                  <div className={styles.recipeInfo}>
                    <h3 className={styles.recipeName}>{recipe.name}</h3>
                    <span className={styles.recipeCategory}>{category.name}</span>
                  </div>
                  <div className={styles.recipeActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRecipe(recipe)
                        setShowAddModal(true)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteRecipe(recipe)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add button */}
      <button 
        className={styles.fab}
        onClick={() => {
          setEditingRecipe(null)
          setShowAddModal(true)
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Modals */}
      {showAddModal && (
        <RecipeModal
          recipe={editingRecipe}
          onClose={() => {
            setShowAddModal(false)
            setEditingRecipe(null)
          }}
          onSave={handleSaveRecipe}
        />
      )}

      {viewingRecipe && (
        <RecipeDetailModal
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={() => {
            setEditingRecipe(viewingRecipe)
            setViewingRecipe(null)
            setShowAddModal(true)
          }}
        />
      )}

      {deleteRecipe && (
        <ConfirmModal
          title="Poista resepti"
          message={`Haluatko varmasti poistaa reseptin "${deleteRecipe.name}"?`}
          confirmText="Poista"
          onConfirm={handleDeleteRecipe}
          onCancel={() => setDeleteRecipe(null)}
        />
      )}
    </div>
  )
}
