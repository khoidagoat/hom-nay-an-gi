import { SEED_RESTAURANTS } from '@/lib/constants/seedData'
import { getContributedRestaurants, calculateHaversineDistance } from '@/lib/utils/queryRestaurants'
import { RestaurantWithDistance } from '@/types'

export interface DuplicateMatch {
  restaurant: Omit<RestaurantWithDistance, 'distance_meters'>
  similarity: number
  distanceMeters?: number
  reason: string
}

/**
 * Chuẩn hóa chuỗi tiếng Việt: Bỏ dấu, chữ thường, loại bỏ tiền tố thừa (quán, tiệm, nhà hàng...)
 */
export function normalizeRestaurantName(name: string): string {
  if (!name) return ''
  let cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Bỏ các từ tiền tố chung phổ biến
  const prefixes = [
    'quan an ngon',
    'quan an',
    'nha hang',
    'tiem an',
    'tiem',
    'quan',
    'am thuc'
  ]
  for (const p of prefixes) {
    if (cleaned.startsWith(p + ' ')) {
      cleaned = cleaned.substring(p.length + 1).trim()
      break
    }
  }

  return cleaned
}

/**
 * Tính toán độ tương đồng giữa 2 chuỗi theo thuật toán Dice's Coefficient (0.0 -> 1.0)
 */
function diceSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length)
    const maxLen = Math.max(s1.length, s2.length)
    if (minLen / maxLen >= 0.7) return 0.95
    return 0.85
  }

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>()
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2))
    }
    return bigrams
  }

  const b1 = getBigrams(s1)
  const b2 = getBigrams(s2)
  if (b1.size === 0 || b2.size === 0) return 0

  let matches = 0
  b1.forEach((item) => {
    if (b2.has(item)) matches++
  })

  return (2 * matches) / (b1.size + b2.size)
}

/**
 * Trích xuất tên đường cơ bản từ chuỗi địa chỉ
 */
function extractStreetName(address: string): string {
  const norm = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  // Bắt các tên đường phổ biến sau "đường" hoặc sau số nhà
  const match = norm.match(/(?:duong\s+)?([a-z0-9\s]+?)(?:,\s*(?:phuong|p\.|quan|q\.|huyen|tp|thi tran))/i)
  if (match) return match[1].trim()
  return norm
}

/**
 * Quét tìm quán ăn trùng lặp trong kho dữ liệu
 */
export function findDuplicateRestaurant(
  inputName: string,
  inputAddress: string,
  inputCoords?: { lat: number; lng: number } | null
): DuplicateMatch | null {
  const normInputName = normalizeRestaurantName(inputName)
  if (normInputName.length < 3) return null

  const normInputStreet = extractStreetName(inputAddress)

  // Danh sách quán cần đối soát (Bao gồm Seed data + Quán người dùng đã góp)
  const pool = [...getContributedRestaurants(), ...SEED_RESTAURANTS]

  let bestMatch: DuplicateMatch | null = null
  let highestScore = 0

  for (const r of pool) {
    const normTargetName = normalizeRestaurantName(r.name)
    const sim = diceSimilarity(normInputName, normTargetName)

    let dist: number | undefined = undefined
    if (inputCoords && r.lat && r.lng) {
      dist = calculateHaversineDistance(inputCoords.lat, inputCoords.lng, r.lat, r.lng)
    }

    const normTargetStreet = extractStreetName(r.address)
    const sameStreet =
      normInputStreet.length > 4 &&
      normTargetStreet.length > 4 &&
      (normInputStreet.includes(normTargetStreet) || normTargetStreet.includes(normInputStreet))

    // TRƯỜNG HỢP 1: Tên gần như trùng khớp hoàn toàn (sim >= 0.82)
    if (sim >= 0.82) {
      const score = sim
      if (score > highestScore) {
        highestScore = score
        bestMatch = {
          restaurant: r,
          similarity: Math.round(sim * 100),
          distanceMeters: dist,
          reason: 'Tên quán ăn gần như trùng khớp với quán đã có'
        }
      }
    }
    // TRƯỜNG HỢP 2: Tên khá giống (sim >= 0.55) VÀ vị trí cực gần (< 250m)
    else if (sim >= 0.55 && dist !== undefined && dist < 250) {
      const score = sim + 0.3
      if (score > highestScore) {
        highestScore = score
        bestMatch = {
          restaurant: r,
          similarity: Math.round(sim * 100),
          distanceMeters: dist,
          reason: `Quán cùng tên ở ngay gần vị trí này (cách khoảng ${dist}m)`
        }
      }
    }
    // TRƯỜNG HỢP 3: Tên khá giống (sim >= 0.60) VÀ nằm trên cùng một con đường
    else if (sim >= 0.60 && sameStreet) {
      const score = sim + 0.25
      if (score > highestScore) {
        highestScore = score
        bestMatch = {
          restaurant: r,
          similarity: Math.round(sim * 100),
          distanceMeters: dist,
          reason: 'Quán cùng tên trên cùng một tuyến đường'
        }
      }
    }
  }

  return bestMatch
}
