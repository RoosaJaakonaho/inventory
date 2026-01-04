import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Sub-locations (storage areas within a location)
export const SUB_LOCATIONS = [
  { id: 'pakastin', name: 'Pakastin', icon: '🧊' },
  { id: 'jaakaappi', name: 'Jääkaappi', icon: '❄️' },
  { id: 'kuiva', name: 'Kuiva', icon: '🏠' },
]

// Categories per sub-location
export const CATEGORIES = {
  pakastin: [
    { id: 'pakastin_kana', name: 'Kana', icon: '🍗' },
    { id: 'pakastin_kala', name: 'Kala', icon: '🐟' },
    { id: 'pakastin_punainen', name: 'Punainen liha', icon: '🥩' },
    { id: 'pakastin_kasvis', name: 'Kasvis', icon: '🥬' },
    { id: 'pakastin_valmisruoka', name: 'Valmisruoka', icon: '🍱' },
    { id: 'pakastin_muu', name: 'Muu', icon: '📦' },
  ],
  jaakaappi: [
    { id: 'jaakaappi_sailykkeet', name: 'Säilykkeet', icon: '🥫' },
    { id: 'jaakaappi_muut', name: 'Muut', icon: '📦' },
  ],
  kuiva: [
    { id: 'kuiva_pasta', name: 'Pasta', icon: '🍝' },
    { id: 'kuiva_riisi', name: 'Riisi', icon: '🍚' },
    { id: 'kuiva_sailykkeet', name: 'Säilykkeet', icon: '🥫' },
    { id: 'kuiva_snax', name: 'Snäx', icon: '🍿' },
    { id: 'kuiva_leivonta', name: 'Leivonta', icon: '🧁' },
    { id: 'kuiva_muu', name: 'Muu', icon: '📦' },
  ],
}

// Get all categories as flat list
export const getAllCategories = () => {
  return [
    ...CATEGORIES.pakastin,
    ...CATEGORIES.jaakaappi,
    ...CATEGORIES.kuiva,
  ]
}

// Get category by ID
export const getCategoryById = (id) => {
  const all = getAllCategories()
  return all.find(c => c.id === id) || { id: 'unknown', name: 'Tuntematon', icon: '❓' }
}

// Get sub-location by ID
export const getSubLocationById = (id) => {
  return SUB_LOCATIONS.find(s => s.id === id) || SUB_LOCATIONS[0]
}

// Get sub-location from category ID
export const getSubLocationFromCategory = (categoryId) => {
  if (categoryId.startsWith('pakastin_')) return 'pakastin'
  if (categoryId.startsWith('jaakaappi_')) return 'jaakaappi'
  if (categoryId.startsWith('kuiva_')) return 'kuiva'
  return 'pakastin'
}

// Check if item is in freezer (no expiry, shows added date instead)
export const isInFreezer = (categoryId) => {
  return categoryId?.startsWith('pakastin_')
}

// Date helpers
export const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const getDaysUntilExpiry = (dateString) => {
  if (!dateString) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateString)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const getExpiryStatus = (dateString) => {
  const days = getDaysUntilExpiry(dateString)
  if (days === null) return null
  if (days < 0) return 'expired'
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  return 'ok'
}