import { useState, useEffect, useMemo } from 'react'
import { 
  supabase, 
  SUB_LOCATIONS,
  CATEGORIES,
  getCategoryById, 
  getSubLocationFromCategory,
  isInFreezer,
  isSpice,
  formatDate, 
  getExpiryStatus, 
  getDaysUntilExpiry,
  isExpiringSoon,
  calculateFreezerExpiry,
} from '../lib/supabase'
import AddItemModal from '../components/AddItemModal'
import ItemCard from '../components/ItemCard'
import ShoppingList from './ShoppingList'
import ConfirmModal from '../components/ConfirmModal'
import styles from './LocationView.module.css'

export default function LocationView({ locationType, activeView }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubLocation, setFilterSubLocation] = useState('')

  const subLocations = SUB_LOCATIONS[locationType] || []

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

  const handleAddItem = async (itemData) => {
    const { error } = await supabase
      .from('items')
      .insert([{
        ...itemData,
        location_type: locationType,
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

  // Filter items - memoized
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const itemSubLocation = getSubLocationFromCategory(item.category)
      const matchesSubLocation = !filterSubLocation || itemSubLocation === filterSubLocation
      return matchesSearch && matchesSubLocation
    })
  }, [items, searchQuery, filterSubLocation])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {activeView === 'varasto' && (
        <>
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
                placeholder="Hae tuotteita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.subLocationTabs}>
              <button
                className={`${styles.subLocationTab} ${!filterSubLocation ? styles.active : ''}`}
                onClick={() => setFilterSubLocation('')}
              >
                Kaikki
              </button>
              {subLocations.map(sub => (
                <button
                  key={sub.id}
                  className={`${styles.subLocationTab} ${filterSubLocation === sub.id ? styles.active : ''}`}
                  onClick={() => setFilterSubLocation(sub.id)}
                >
                  {sub.icon} {sub.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.mainContent}>
            {filteredItems.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📦</div>
                <p>{searchQuery || filterSubLocation ? 'Ei hakua vastaavia tuotteita' : 'Ei tuotteita vielä'}</p>
                {!searchQuery && !filterSubLocation && (
                  <button 
                    className="btn btn-secondary btn-sm mt-3"
                    onClick={() => setShowAddModal(true)}
                  >
                    Lisää ensimmäinen tuote
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.itemsList}>
                {filteredItems.map(item => (
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
            )}
          </div>

          {/* Add button */}
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
        </>
      )}

      {activeView === 'kauppalista' && (
        <ShoppingList 
          locationType={locationType} 
          onItemsAdded={fetchItems}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          item={editingItem}
          locationType={locationType}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
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
