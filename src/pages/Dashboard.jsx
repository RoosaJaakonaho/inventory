import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { 
  supabase, 
  SUB_LOCATIONS,
  CATEGORIES,
  getAllCategories,
  getCategoryById, 
  getSubLocationById,
  getSubLocationFromCategory,
  isInFreezer,
  formatDate, 
  getExpiryStatus, 
  getDaysUntilExpiry 
} from '../lib/supabase'
import AddItemModal from '../components/AddItemModal'
import ItemCard from '../components/ItemCard'
import HistoryModal from '../components/HistoryModal'
import ShoppingList from './ShoppingList'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [locations, setLocations] = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubLocation, setFilterSubLocation] = useState('')
  const [showExpiring, setShowExpiring] = useState(false)
  const [activeTab, setActiveTab] = useState('varasto') // 'varasto' or 'kauppalista'

  // Fetch locations
  useEffect(() => {
    fetchLocations()
  }, [])

  // Fetch items when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchItems()
    }
  }, [currentLocation])

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching locations:', error)
      return
    }

    setLocations(data || [])
    if (data && data.length > 0) {
      setCurrentLocation(data[0])
    }
    setLoading(false)
  }

  const fetchItems = async () => {
    if (!currentLocation) return

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('location_id', currentLocation.id)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return
    }

    setItems(data || [])
  }

  const handleAddItem = async (itemData) => {
    const { data, error } = await supabase
      .from('items')
      .insert([{
        ...itemData,
        location_id: currentLocation.id,
        in_stock: true,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding item:', error)
      return
    }

    // Log history
    await supabase.from('history').insert([{
      item_id: data.id,
      location_id: currentLocation.id,
      action: 'added',
      user_email: user.email,
      details: `Lisätty: ${itemData.name}`,
    }])

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

    // Log history
    await supabase.from('history').insert([{
      item_id: editingItem.id,
      location_id: currentLocation.id,
      action: 'updated',
      user_email: user.email,
      details: `Muokattu: ${itemData.name}`,
    }])

    fetchItems()
    setEditingItem(null)
    setShowAddModal(false)
  }

  const handleRemoveItem = async (item) => {
    const { error } = await supabase
      .from('items')
      .update({ in_stock: false })
      .eq('id', item.id)

    if (error) {
      console.error('Error removing item:', error)
      return
    }

    // Log history
    await supabase.from('history').insert([{
      item_id: item.id,
      location_id: currentLocation.id,
      action: 'removed',
      user_email: user.email,
      details: `Poistettu: ${item.name}`,
    }])

    fetchItems()
  }

  const handleRestoreItem = async (item) => {
    const { error } = await supabase
      .from('items')
      .update({ in_stock: true })
      .eq('id', item.id)

    if (error) {
      console.error('Error restoring item:', error)
      return
    }

    await supabase.from('history').insert([{
      item_id: item.id,
      location_id: currentLocation.id,
      action: 'restored',
      user_email: user.email,
      details: `Palautettu: ${item.name}`,
    }])

    fetchItems()
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const itemSubLocation = getSubLocationFromCategory(item.category)
    const matchesSubLocation = !filterSubLocation || itemSubLocation === filterSubLocation
    const matchesExpiring = !showExpiring || (
      !isInFreezer(item.category) && 
      ['expired', 'critical', 'warning'].includes(getExpiryStatus(item.expiry_date))
    )
    return matchesSearch && matchesSubLocation && matchesExpiring
  })

  // Count expiring items (excluding freezer items)
  const expiringCount = items.filter(item => 
    !isInFreezer(item.category) &&
    ['expired', 'critical', 'warning'].includes(getExpiryStatus(item.expiry_date))
  ).length

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Käyttäjä'

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.greeting}>Hei, {username}</h1>
            <p className={styles.subtitle}>
              {items.length} tuotetta varastossa
              {expiringCount > 0 && (
                <span className={styles.expiringBadge}>
                  {expiringCount} vanhenemassa
                </span>
              )}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className="btn btn-icon btn-secondary"
              onClick={() => setShowHistoryModal(true)}
              title="Historia"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
            <button 
              className="btn btn-icon btn-secondary"
              onClick={signOut}
              title="Kirjaudu ulos"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Location selector (for multiple locations like Home, Cabin) */}
        {locations.length > 1 && (
          <div className={styles.locationSelector}>
            {locations.map(loc => (
              <button
                key={loc.id}
                className={`${styles.locationBtn} ${currentLocation?.id === loc.id ? styles.active : ''}`}
                onClick={() => setCurrentLocation(loc)}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}

        {locations.length === 1 && (
          <div className={styles.locationBadge}>
            📍 {currentLocation?.name}
          </div>
        )}

        {/* Tab toggle */}
        <div className={styles.tabToggle}>
          <button
            className={`${styles.tab} ${activeTab === 'varasto' ? styles.active : ''}`}
            onClick={() => setActiveTab('varasto')}
          >
            📦 Varasto
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'kauppalista' ? styles.active : ''}`}
            onClick={() => setActiveTab('kauppalista')}
          >
            🛒 Kauppalista
          </button>
        </div>
      </header>

      {activeTab === 'varasto' ? (
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

            {/* Sub-location filter tabs */}
            <div className={styles.subLocationTabs}>
              <button
                className={`${styles.subLocationTab} ${!filterSubLocation ? styles.active : ''}`}
                onClick={() => setFilterSubLocation('')}
              >
                Kaikki
              </button>
              {SUB_LOCATIONS.map(sub => (
                <button
                  key={sub.id}
                  className={`${styles.subLocationTab} ${filterSubLocation === sub.id ? styles.active : ''}`}
                  onClick={() => setFilterSubLocation(sub.id)}
                >
                  {sub.icon} {sub.name}
                </button>
              ))}
            </div>

            {/* Expiring filter */}
            {expiringCount > 0 && (
              <button
                className={`${styles.expiringBtn} ${showExpiring ? styles.active : ''}`}
                onClick={() => setShowExpiring(!showExpiring)}
              >
                ⚠️ Vanhenemassa
                <span className={styles.count}>{expiringCount}</span>
              </button>
            )}
          </div>

          {/* Items list */}
          <main className={styles.main}>
            {filteredItems.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📦</div>
                <p>{searchQuery || filterSubLocation || showExpiring ? 'Ei hakua vastaavia tuotteita' : 'Ei tuotteita vielä'}</p>
                {!searchQuery && !filterSubLocation && !showExpiring && (
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
                    onEdit={() => {
                      setEditingItem(item)
                      setShowAddModal(true)
                    }}
                    onRemove={() => handleRemoveItem(item)}
                  />
                ))}
              </div>
            )}
          </main>

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
      ) : (
        <ShoppingList 
          locationId={currentLocation?.id} 
          onItemsAdded={fetchItems}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          locationId={currentLocation?.id}
          onClose={() => setShowHistoryModal(false)}
          onRestore={handleRestoreItem}
        />
      )}
    </div>
  )
}