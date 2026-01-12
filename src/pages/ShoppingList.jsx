import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  supabase, 
  SUB_LOCATIONS,
  CATEGORIES,
  getCategoryById, 
  getSubLocationFromCategory,
  isInFreezer,
  calculateFreezerExpiry,
} from '../lib/supabase'
import AddShoppingItemModal from '../components/AddShoppingItemModal'
import styles from './ShoppingList.module.css'

function SortableItem({ item, onToggle, onEdit, onDelete }) {
  const category = item.category ? getCategoryById(item.category) : null
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${item.checked ? styles.checked : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="1.5"/>
          <circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/>
          <circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      <div 
        className={styles.checkbox}
        onClick={() => onToggle(item)}
      >
        {item.checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      <div 
        className={styles.itemInfo}
        onClick={() => onToggle(item)}
      >
        <span className={styles.itemName}>
          {item.amount && `${item.amount} ${item.unit || ''} `}{item.name}
        </span>
        {!item.is_non_inventory && category && (
          <span className={styles.itemMeta}>
            {category.icon} {category.name}
          </span>
        )}
        {item.is_non_inventory && (
          <span className={styles.itemMeta}>Ei inventaarioon</span>
        )}
      </div>
      <button 
        className={styles.editBtn}
        onClick={() => onEdit(item)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button 
        className={styles.deleteBtn}
        onClick={() => onDelete(item)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export default function ShoppingList({ locationType, onItemsAdded }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [finishing, setFinishing] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  )

  useEffect(() => {
    fetchItems()
  }, [locationType])

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('location_type', locationType)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching shopping list:', error)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    // Update sort_order in database
    const updates = newItems.map((item, idx) => 
      supabase
        .from('shopping_list')
        .update({ sort_order: idx })
        .eq('id', item.id)
    )
    await Promise.all(updates)
  }

  const handleAddItem = async (itemData) => {
    const { error } = await supabase
      .from('shopping_list')
      .insert([{
        ...itemData,
        location_type: locationType,
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
      // Skip non-inventory items - just remove from list
      if (item.is_non_inventory) {
        await supabase
          .from('shopping_list')
          .delete()
          .eq('id', item.id)
        continue
      }

      // Add food items to inventory
      const inFreezer = isInFreezer(item.category)
      
      const { error: insertError } = await supabase
        .from('items')
        .insert([{
          location_type: locationType,
          name: item.name,
          category: item.category,
          amount: item.amount,
          unit: item.unit,
          expiry_date: inFreezer ? null : (item.expiry_date || null),
          frozen_date: inFreezer ? (item.frozen_date || new Date().toISOString().split('T')[0]) : null,
        }])

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className={styles.list}>
                {items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    onEdit={(item) => {
                      setEditingItem(item)
                      setShowAddModal(true)
                    }}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

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

      {/* FAB - always visible */}
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
          locationType={locationType}
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