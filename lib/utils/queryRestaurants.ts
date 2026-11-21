import { SEED_RESTAURANTS } from '@/lib/constants/seedData'
import { RestaurantWithDistance, ActiveFiltersState } from '@/types'

// Hàm tính khoảng cách Haversine chuẩn xác giữa 2 tọa độ GPS (đơn vị: mét)
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}

// Dung sai tối đa cho phép lệch so với bán kính chọn: 200 mét
const RADIUS_TOLERANCE_METERS = 200

// Lấy danh sách quán người dùng tự đóng góp từ localStorage (Offline-first)
export function getContributedRestaurants(): Omit<RestaurantWithDistance, 'distance_meters'>[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('contributed_restaurants')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function fetchNearbyRestaurants({
  lat,
  lng,
  activeFilters,
  excludeIds = []
}: {
  lat: number
  lng: number
  activeFilters: ActiveFiltersState
  excludeIds?: string[]
}): Promise<RestaurantWithDistance[]> {
  const { vibes, parking, radiusMeters, cuisine, priceTiers } = activeFilters

  // Phạm vi bán kính tối đa nghiêm ngặt (chỉ cho phép lệch tối đa ~200m)
  const maxAllowedDistance = radiusMeters + RADIUS_TOLERANCE_METERS

  const contributed = getContributedRestaurants()
  const allRestaurants = [...contributed, ...SEED_RESTAURANTS]

  const filtered = allRestaurants
    .map((r) => ({
      ...r,
      distance_meters: calculateHaversineDistance(lat, lng, r.lat, r.lng)
    }))
    .filter((r) => {
      // 1. TUÂN THỦ NGHIÊM NGẶT BÁN KÍNH (Chỉ cho phép lệch tối đa ~200m)
      if (r.distance_meters > maxAllowedDistance) {
        return false
      }

      // 2. Lọc loại trừ (lịch sử 7 ngày từ localStorage)
      if (excludeIds.includes(r.id)) {
        return false
      }

      // 3. Lọc theo các thẻ Vibe (Multi-select):
      // - Trời nóng cần mát: Bắt buộc có máy lạnh
      if (vibes.includes('mat_me') && !r.has_ac) {
        return false
      }

      // - Cuối tháng hết tiền: Mức giá 1 (Dưới 100k theo chuẩn Google)
      if (vibes.includes('cuoi_thang') && r.price_level !== 1) {
        return false
      }

      // - Hẹn hò lãng mạn: Quán có tag hen_ho và có máy lạnh
      if (vibes.includes('hen_ho')) {
        const isRomantic = r.vibe_tags.includes('hen_ho') && r.has_ac
        if (!isRomantic) return false
      }

      // 4. Lọc Chỗ đỗ xe (Parking Filter):
      if (parking === 'moto' && !r.free_moto_parking) {
        return false
      }
      if (parking === 'car' && !r.has_car_parking) {
        return false
      }
      if (parking === 'both' && (!r.has_car_parking || !r.free_moto_parking)) {
        return false
      }

      // 5. Lọc loại món ăn:
      if (cuisine !== null && r.cuisine !== cuisine) {
        return false
      }

      // 6. Lọc mức giá theo chuẩn Google Maps (1-100k, 100-200k, 200-600k, >600k):
      if (priceTiers && priceTiers.length > 0) {
        if (!priceTiers.includes(r.price_level)) {
          return false
        }
      }

      return true
    })
    // Sắp xếp theo khoảng cách từ gần đến xa
    .sort((a, b) => a.distance_meters - b.distance_meters)

  return filtered
}
