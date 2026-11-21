/**
 * Tiện ích bản đồ và tích hợp chỉ đường (Chuẩn Google Maps Universal URLs)
 * Đảm bảo 0đ chi phí vận hành (không dùng Google Places API có phí).
 */

/**
 * Suy luận quận / khu vực tại TP.HCM dựa trên tọa độ GPS thực tế
 */
export function getDistrictLabelFromCoords(lat: number, lng: number): string {
  // Bounding box tương đối của các quận chính TP.HCM
  // Quận 7: 10.71 -> 10.76 N, 106.69 -> 106.75 E
  if (lat >= 10.71 && lat <= 10.76 && lng >= 106.69 && lng <= 106.75) {
    if (lat <= 10.735) return 'Quận 7 (Phú Mỹ Hưng)'
    return 'Quận 7'
  }
  // Quận 1: 10.765 -> 10.795 N, 106.685 -> 106.710 E
  if (lat >= 10.765 && lat <= 10.795 && lng >= 106.685 && lng <= 106.710) {
    return 'Quận 1'
  }
  // Quận 3: 10.770 -> 10.795 N, 106.670 -> 106.695 E
  if (lat >= 10.770 && lat <= 10.795 && lng >= 106.670 && lng <= 106.695) {
    return 'Quận 3'
  }
  // Bình Thạnh: 10.785 -> 10.835 N, 106.695 -> 106.735 E
  if (lat >= 10.785 && lat <= 10.835 && lng >= 106.695 && lng <= 106.735) {
    return 'Bình Thạnh'
  }
  // Phú Nhuận: 10.790 -> 10.815 N, 106.665 -> 106.690 E
  if (lat >= 10.790 && lat <= 10.815 && lng >= 106.665 && lng <= 106.690) {
    return 'Phú Nhuận'
  }
  // Quận 4: 10.750 -> 10.770 N, 106.695 -> 106.720 E
  if (lat >= 10.750 && lat <= 10.770 && lng >= 106.695 && lng <= 106.720) {
    return 'Quận 4'
  }
  // Quận 5 & 10: 10.745 -> 10.780 N, 106.650 -> 106.680 E
  if (lat >= 10.745 && lat <= 10.780 && lng >= 106.650 && lng <= 106.680) {
    return 'Quận 5 / Quận 10'
  }
  // Tân Bình: 10.780 -> 10.830 N, 106.635 -> 106.670 E
  if (lat >= 10.780 && lat <= 10.830 && lng >= 106.635 && lng <= 106.670) {
    return 'Tân Bình'
  }
  // TP. Thủ Đức: 10.780 -> 10.880 N, 106.730 -> 106.840 E
  if (lat >= 10.780 && lat <= 10.880 && lng >= 106.730 && lng <= 106.840) {
    return 'TP. Thủ Đức'
  }

  return 'Vị trí GPS'
}

/**
 * Tọa độ tâm các quận chính TP.HCM phục vụ fallback khi người dùng nhập địa chỉ không có GPS
 */
export const DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'quận 1': { lat: 10.7769, lng: 106.7009 },
  'quận 3': { lat: 10.7845, lng: 106.6844 },
  'quận 4': { lat: 10.7578, lng: 106.7013 },
  'quận 5': { lat: 10.7554, lng: 106.6667 },
  'quận 7': { lat: 10.734, lng: 106.7218 },
  'quận 10': { lat: 10.7716, lng: 106.6675 },
  'bình thạnh': { lat: 10.803, lng: 106.7093 },
  'phú nhuận': { lat: 10.7992, lng: 106.6803 },
  'tân bình': { lat: 10.8015, lng: 106.6558 },
  'thủ đức': { lat: 10.8494, lng: 106.7537 },
  'quận 2': { lat: 10.7872, lng: 106.7498 },
  'quận 9': { lat: 10.8428, lng: 106.8287 },
  'gò vấp': { lat: 10.8387, lng: 106.6653 }
}

/**
 * Suy luận tọa độ gần đúng từ địa chỉ người dùng nhập dựa trên tên quận
 */
export function getCoordsFromAddress(address: string): { lat: number; lng: number } {
  const norm = address.toLowerCase()
  for (const [district, coords] of Object.entries(DISTRICT_CENTROIDS)) {
    if (norm.includes(district)) {
      return coords
    }
  }
  // Mặc định trung tâm Quận 1 nếu không ghi rõ quận
  return { lat: 10.7769, lng: 106.7009 }
}

/**
 * Tạo URL chỉ đường Google Maps trực tiếp (Turn-by-turn Directions)
 * 
 * QUY TẮC BẢO ĐẢM ĐỘ CHÍNH XÁC:
 * 1. Điểm xuất phát (origin): Được gán chính xác bằng tọa độ GPS thực tế của người dùng (userLat, userLng).
 *    Nếu không truyền origin, Google Maps sẽ tự đoán bằng IP nhà mạng vốn bị lệch 5km - 20km!
 * 2. Đích đến (destination): Tên quán + Địa chỉ thực tế + "TP. Hồ Chí Minh".
 *    Google Maps đối soát với POI chính thức, dẫn đường chính xác đến cửa chính cơ sở kinh doanh.
 */
export function getGoogleMapsDirectionsUrl(
  restaurantLat?: number,
  restaurantLng?: number,
  name?: string,
  address?: string,
  userLat?: number,
  userLng?: number
): string {
  const queryParts: string[] = []
  if (name) queryParts.push(name.trim())
  if (address) queryParts.push(address.trim())

  let destination = ''
  if (queryParts.length > 0) {
    let fullDestination = queryParts.join(', ')
    const lower = fullDestination.toLowerCase()
    if (
      !lower.includes('hồ chí minh') &&
      !lower.includes('hcm') &&
      !lower.includes('tp.hcm') &&
      !lower.includes('saigon') &&
      !lower.includes('sài gòn')
    ) {
      fullDestination += ', TP.HCM'
    }
    destination = fullDestination
  } else if (restaurantLat !== undefined && restaurantLng !== undefined) {
    destination = `${restaurantLat},${restaurantLng}`
  }

  if (!destination) {
    return 'https://www.google.com/maps'
  }

  // Nếu có GPS người dùng, mở chế độ chỉ đường từ vị trí người dùng đến Tên quán + Địa chỉ
  if (userLat !== undefined && userLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${encodeURIComponent(destination)}`
  }

  // Nếu chưa có GPS, mở tìm kiếm POI trực tiếp theo Tên quán + Địa chỉ để tránh lệch tọa độ nhà
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
}

/**
 * Tạo URL tìm kiếm / xem thông tin quán trên Google Maps (Xem ảnh, menu, đánh giá thực tế)
 */
export function getGoogleMapsSearchUrl(name: string, address?: string): string {
  let query = name.trim()
  if (address) {
    query += `, ${address.trim()}`
  }
  const lower = query.toLowerCase()
  if (
    !lower.includes('hồ chí minh') &&
    !lower.includes('hcm') &&
    !lower.includes('tp.hcm') &&
    !lower.includes('saigon') &&
    !lower.includes('sài gòn')
  ) {
    query += ', TP.HCM'
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * Định dạng khoảng cách hiển thị thân thiện (m hoặc km)
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`
  }
  return `${(distanceMeters / 1000).toFixed(1)}km`
}

/**
 * Sao chép văn bản vào clipboard an toàn
 */
export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  }
  return Promise.resolve(false)
}
