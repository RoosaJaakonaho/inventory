import { useState, useEffect } from 'react'
import { 
  supabase, 
  SUB_LOCATIONS,
  CATEGORIES,
  getCategoryById, 
  getSubLocationById,
  getSubLocationFromCategory,
  isInFreezer,
} from '../lib/supabase'
import AddShoppingItemModal from '../components/AddShoppingItemModal'
import styles from './ShoppingList.module.css'

export default function ShoppingList({ locationId, onItemsAdded }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (locationId) {
      fetchItems()
    }
  }, [locationId])

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching shopping list:', error)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  const handleAddItem = async (itemData) => {
    const { error } = await supabase
      .from('shopping_list')
      .insert([{
        ...itemData,
        location_id: locationId,
        checked: false,
      }])

    if (error) {
      console.error('Error adding item:', error)
      return
    }

    fetchItems()
    setShowAddModal(false)
  }

  const handleUpdateItem = async (itemData) => {
    const { error } = await supabase
      .from('shopping_list')
      .update(itemData)
      .eq('id', editingItem.id)

    if (error) {
      console.error('Error updating item:', error)
      return
    }

    fetchItems()
    setEditingItem(null)
    setShowAddModal(false)
  }

  const handleToggleItem = async (item) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked: !item.checked })
      .eq('id', item.id)

    if (error) {
      console.error('Error toggling item:', error)
      return
    }

    setItems(items.map(i => 
      i.id === item.id ? { ...i, checked: !i.checked } : i
    ))
  }

  const handleDeleteItem = async (item) => {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', item.id)

    if (error) {
      console.error('Error deleting item:', error)
      return
    }

    setItems(items.filter(i => i.id !== item.id))
  }

  const handleFinishShopping = async () => {
    const checkedItems = items.filter(i => i.checked)
    if (checkedItems.length === 0) return

    setFinishing(true)

    for (const item of checkedItems) {
      // Skip käyttötavara - just remove from list, don't add to inventory
      if (item.is_kayttotavara) {
        await supabase
          .from('shopping_list')
          .delete()
          .eq('id', item.id)
        continue
      }

      // Add food items to inventory
      const inFreezer = isInFreezer(item.category)
      
      const { data: newItem, error: insertError } = await supabase
        .from('items')
        .insert([{
          location_id: locationId,
          name: item.name,
          category: item.category,
          weight: item.weight,
          expiry_date: inFreezer ? null : null,
          in_stock: true,
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error adding item to inventory:', insertError)
        continue
      }

      // Remove from shopping list
      await supabase
        .from('shopping_list')
        .delete()
        .eq('id', item.id)
    }

    setFinishing(false)
    fetchItems()
    if (onItemsAdded) onItemsAdded()
  }

  const checkedCount = items.filter(i => i.checked).length

  // Separate käyttötavara and food items
  const kayttotavaraItems = items.filter(item => item.is_kayttotavara)
  const foodItems = items.filter(item => !item.is_kayttotavara)

  // Group food items by sub-location
  const groupedFoodItems = SUB_LOCATIONS.map(sub => ({
    ...sub,
    items: foodItems.filter(item => getSubLocationFromCategory(item.category) === sub.id)
  })).filter(group => group.items.length > 0)

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🛒</div>
          <p>Kauppalista on tyhjä</p>
          <button 
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => setShowAddModal(true)}
          >
            Lisää ensimmäinen tuote
          </button>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {/* Food items grouped by sub-location */}
            {groupedFoodItems.map(group => (
              <div key={group.id} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  {group.icon} {group.name}
                </h3>
                {group.items.map(item => {
                  const category = getCategoryById(item.category)
                  return (
                    <div 
                      key={item.id} 
                      className={`${styles.item} ${item.checked ? styles.checked : ''}`}
                    >
                      <div 
                        className={styles.checkbox}
                        onClick={() => handleToggleItem(item)}
                      >
                        {item.checked && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <div 
                        className={styles.itemInfo}
                        onClick={() => handleToggleItem(item)}
                      >
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemMeta}>
                          {category.name}
                          {item.weight && ` · ${item.weight}`}
                        </span>
                      </div>
                      <button 
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingItem(item)
                          setShowAddModal(true)
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteItem(item)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Käyttötavara items */}
            {kayttotavaraItems.length > 0 && (
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>
                  🧹 Käyttötavara
                </h3>
                {kayttotavaraItems.map(item => (
                  <div 
                    key={item.id} 
                    className={`${styles.item} ${item.checked ? styles.checked : ''}`}
                  >
                    <div 
                      className={styles.checkbox}
                      onClick={() => handleToggleItem(item)}
                    >
                      {item.checked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div 
                      className={styles.itemInfo}
                      onClick={() => handleToggleItem(item)}
                    >
                      <span className={styles.itemName}>{item.name}</span>
                    </div>
                    <button 
                      className={styles.editBtn}
                      onClick={() => {
                        setEditingItem(item)
                        setShowAddModal(true)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteItem(item)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {checkedCount > 0 && (
            <div className={styles.finishBar}>
              <button 
                className="btn btn-primary w-full"
                onClick={handleFinishShopping}
                disabled={finishing}
              >
                {finishing ? 'Lisätään...' : `Valmis (${checkedCount} tuotetta)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button 
        className={styles.fab}
        onClick={() => {
          setEditingItem(null)
          setShowAddModal(true)
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {showAddModal && (
        <AddShoppingItemModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
        />
      )}
    </div>
  )
}