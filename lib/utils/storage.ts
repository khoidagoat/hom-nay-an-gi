import { MealHistoryItem, Coordinates } from '@/types'

const STORAGE_KEY = 'hom_nay_an_gi_history_v1'
const USER_LOCATION_KEY = 'hom_nay_an_gi_user_location_v1'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function getMealHistory(): MealHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: MealHistoryItem[] = JSON.parse(raw)
    const now = Date.now()
    // Lọc lại các quán trong 7 ngày gần nhất
    const valid = parsed.filter(item => now - item.timestamp <= SEVEN_DAYS_MS)
    return valid
  } catch (e) {
    console.error('Lỗi khi đọc lịch sử từ localStorage:', e)
    return []
  }
}

export function getExcludedRestaurantIds(): string[] {
  return getMealHistory().map(item => item.restaurantId)
}

export function saveMealToHistory(
  restaurantId: string,
  restaurantName: string,
  cuisine: string,
  details?: {
    address?: string
    image_url?: string
    price_range_text?: string
    rating?: number
  }
): void {
  if (typeof window === 'undefined') return
  try {
    const history = getMealHistory()
    const now = new Date()
    const newItem: MealHistoryItem = {
      restaurantId,
      restaurantName,
      cuisine,
      address: details?.address,
      image_url: details?.image_url,
      price_range_text: details?.price_range_text,
      rating: details?.rating,
      timestamp: now.getTime(),
      dateString: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`
    }
    // Đẩy quán mới lên đầu danh sách, tránh trùng lặp cùng ID trong ngày
    const filtered = history.filter(item => item.restaurantId !== restaurantId)
    const updated = [newItem, ...filtered].slice(0, 30) // Giữ tối đa 30 lượt ăn gần nhất
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Lỗi khi lưu lịch sử vào localStorage:', e)
  }
}

export function deleteMealFromHistory(restaurantId: string): MealHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const history = getMealHistory()
    const updated = history.filter(item => item.restaurantId !== restaurantId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('Lỗi khi xóa quán khỏi lịch sử:', e)
    return []
  }
}

export function clearMealHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Lưu vị trí người dùng đã chọn hoặc GPS đã lấy được
 */
export function getSavedUserLocation(): Coordinates | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function saveUserLocation(coords: Coordinates): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(coords))
  } catch (e) {}
}
