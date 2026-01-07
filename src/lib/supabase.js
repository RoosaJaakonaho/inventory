import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Location types
export const LOCATION_TYPES = {
  KOTI: 'koti',
  MOKKI: 'mokki',
}

// Sub-locations per location type
export const SUB_LOCATIONS = {
  koti: [
    { id: 'pakastin', name: 'Pakastin', icon: '🧊' },
    { id: 'jaakaappi', name: 'Jääkaappi', icon: '❄️' },
    { id: 'kuiva', name: 'Kuiva', icon: '🏠' },
  ],
  mokki: [
    { id: 'jaakaappi', name: 'Jääkaappi', icon: '❄️' },
    { id: 'kuiva', name: 'Kuiva', icon: '🏠' },
    { id: 'muu', name: 'Muu', icon: '📦' },
  ],
}

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
    { id: 'kuiva_mausteet', name: 'Mausteet', icon: '🧂' },
    { id: 'kuiva_muu', name: 'Muu', icon: '📦' },
  ],
  muu: [
    { id: 'muu_tarvikkeet', name: 'Tarvikkeet', icon: '🧻' },
  ],
}

// Recipe categories
export const RECIPE_CATEGORIES = [
  { id: 'salaatti', name: 'Salaatti', icon: '🥗' },
  { id: 'kastike', name: 'Kastike', icon: '🥣' },
  { id: 'keitto', name: 'Keitto', icon: '🍲' },
  { id: 'pastaruoat', name: 'Pastaruoat', icon: '🍝' },
  { id: 'wokki', name: 'Wokki ja nuudeli', icon: '🥡' },
  { id: 'riisi', name: 'Riisi', icon: '🍚' },
  { id: 'liha', name: 'Liha', icon: '🥩' },
  { id: 'kasvis', name: 'Kasvis', icon: '🥬' },
  { id: 'suolainen_piirakka', name: 'Suolainen piirakka', icon: '🥧' },
  { id: 'muu', name: 'Muu', icon: '🍽️' },
  { id: 'suolainen_leivonta', name: 'Suolainen leivonta', icon: '🥐' },
  { id: 'makea', name: 'Makea', icon: '🍰' },
]

// Measurement units for recipes
export const UNITS = [
  { id: 'kpl', name: 'kpl' },
  { id: 'g', name: 'g' },
  { id: 'kg', name: 'kg' },
  { id: 'ml', name: 'ml' },
  { id: 'dl', name: 'dl' },
  { id: 'l', name: 'l' },
  { id: 'tl', name: 'tl' },
  { id: 'rkl', name: 'rkl' },
  { id: 'ripaus', name: 'ripaus' },
]

// Parse amount range and return max value (e.g. "2-3" returns "3", "2" returns "2")
export const getMaxAmount = (amount) => {
  if (!amount) return null
  const str = String(amount).trim()
  if (str.includes('-')) {
    const parts = str.split('-')
    return parts[parts.length - 1].trim()
  }
  return str
}

// Freezer expiry times in days
export const FREEZER_EXPIRY_DAYS = {
  pakastin_kana: 90,        // 3 months
  pakastin_kala: 75,        // 2.5 months
  pakastin_punainen: 120,   // 4 months
  pakastin_valmisruoka: 60, // 2 months
  pakastin_kasvis: null,    // No expiry
  pakastin_muu: null,       // No expiry
}

// Get all categories as flat list
export const getAllCategories = () => {
  return [
    ...CATEGORIES.pakastin,
    ...CATEGORIES.jaakaappi,
    ...CATEGORIES.kuiva,
    ...CATEGORIES.muu,
  ]
}

// Get category by ID
export const getCategoryById = (id) => {
  const all = getAllCategories()
  return all.find(c => c.id === id) || { id: 'unknown', name: 'Tuntematon', icon: '❓' }
}

// Get sub-location by ID
export const getSubLocationById = (id) => {
  const allSubs = [...SUB_LOCATIONS.koti, ...SUB_LOCATIONS.mokki]
  return allSubs.find(s => s.id === id) || { id: 'unknown', name: 'Tuntematon', icon: '❓' }
}

// Get sub-location from category ID
export const getSubLocationFromCategory = (categoryId) => {
  if (!categoryId) return null
  if (categoryId.startsWith('pakastin_')) return 'pakastin'
  if (categoryId.startsWith('jaakaappi_')) return 'jaakaappi'
  if (categoryId.startsWith('kuiva_')) return 'kuiva'
  if (categoryId.startsWith('muu_')) return 'muu'
  return null
}

// Check if item is in freezer
export const isInFreezer = (categoryId) => {
  return categoryId?.startsWith('pakastin_')
}

// Check if item is spice (no expiry needed)
export const isSpice = (categoryId) => {
  return categoryId === 'kuiva_mausteet'
}

// Calculate freezer expiry date from frozen date
export const calculateFreezerExpiry = (frozenDate, categoryId) => {
  const expiryDays = FREEZER_EXPIRY_DAYS[categoryId]
  if (!expiryDays || !frozenDate) return null
  
  const date = new Date(frozenDate)
  date.setDate(date.getDate() + expiryDays)
  return date.toISOString().split('T')[0]
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
  if (days <= 7) return 'critical'
  if (days <= 21) return 'warning' // 3 weeks
  return 'ok'
}

// Check if item is expiring soon (within 2-3 weeks)
export const isExpiringSoon = (dateString) => {
  const days = getDaysUntilExpiry(dateString)
  if (days === null) return false
  return days <= 21 && days >= 0
}

// Get recipe category by ID
export const getRecipeCategoryById = (id) => {
  return RECIPE_CATEGORIES.find(c => c.id === id) || { id: 'unknown', name: 'Tuntematon', icon: '❓' }
}
