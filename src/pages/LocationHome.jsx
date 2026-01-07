import { useState, useEffect, useMemo } from 'react'
import { 
  supabase, 
  getCategoryById, 
  getSubLocationFromCategory,
  isInFreezer,
  isSpice,
  isExpiringSoon,
  calculateFreezerExpiry,
} from '../lib/supabase'
import ItemCard from '../components/ItemCard'
import AddItemModal from '../components/AddItemModal'
import ConfirmModal from '../components/ConfirmModal'
import styles from './LocationHome.module.css'

export default function LocationHome({ locationType }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [locationType])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('location_type', locationType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  const handleUpdateItem = async (itemData) => {
    const { error } = await supabase
      .from('items')
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

  const handleDeleteItem = async () => {
    if (!deleteItem) return

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', deleteItem.id)

    if (error) {
      console.error('Error deleting item:', error)
      return
    }

    setDeleteItem(null)
    fetchItems()
  }

  // Get expiry date for display (calculated for freezer items)
  const getItemExpiryDate = (item) => {
    if (isInFreezer(item.category) && item.frozen_date) {
      return calculateFreezerExpiry(item.frozen_date, item.category)
    }
    return item.expiry_date
  }

  // Get expiring items (within 3 weeks) - memoized
  const expiringItems = useMemo(() => {
    return items.filter(item => {
      const expiryDate = getItemExpiryDate(item)
      return isExpiringSoon(expiryDate)
    })
  }, [items])

  // Items without expiry date (excluding spices) - memoized
  const itemsWithoutDate = useMemo(() => {
    return items.filter(item => {
      if (isSpice(item.category)) return false
      if (isInFreezer(item.category)) {
        return !item.frozen_date
      }
      return !item.expiry_date
    })
  }, [items])

  const hasIssues = expiringItems.length > 0 || itemsWithoutDate.length > 0

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Issues section */}
      <div className={styles.issuesSection}>
        {!hasIssues ? (
          <div className={styles.allGood}>
            <div className={styles.allGoodIcon}>✨</div>
            <p>Kaikki kunnossa!</p>
            <span className={styles.allGoodSub}>Ei vanhentuvia tuotteita tai puuttuvia päiväyksiä</span>
          </div>
        ) : (
          <div className={styles.issuesList}>
            {itemsWithoutDate.length > 0 && (
              <div className={styles.issueGroup}>
                <h3 className={styles.issueTitle}>
                  📝 Lisää päiväys
                  <span className={styles.issueBadge}>{itemsWithoutDate.length}</span>
                </h3>
                <div className={styles.issueItems}>
                  {itemsWithoutDate.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      expiryDate={getItemExpiryDate(item)}
                      onEdit={() => {
                        setEditingItem(item)
                        setShowAddModal(true)
                      }}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}
            {expiringItems.length > 0 && (
              <div className={styles.issueGroup}>
                <h3 className={styles.issueTitle}>
                  ⏰ Vanhenemassa
                  <span className={styles.issueBadge}>{expiringItems.length}</span>
                </h3>
                <div className={styles.issueItems}>
                  {expiringItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      expiryDate={getItemExpiryDate(item)}
                      onEdit={() => {
                        setEditingItem(item)
                        setShowAddModal(true)
                      }}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          item={editingItem}
          locationType={locationType}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={handleUpdateItem}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          title="Poista tuote"
          message={`Haluatko varmasti poistaa tuotteen "${deleteItem.name}"?`}
          confirmText="Poista"
          onConfirm={handleDeleteItem}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  )
}
