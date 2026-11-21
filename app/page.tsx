'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/common/Header'
import VibeGrid from '@/components/solo/VibeGrid'
import AdvancedFilterModal from '@/components/solo/AdvancedFilterModal'
import RestaurantCard from '@/components/solo/RestaurantCard'
import DecisionModal from '@/components/solo/DecisionModal'
import { Coordinates, VibeKey, ParkingFilterOption, ActiveFiltersState, RestaurantWithDistance } from '@/types'
import { DEFAULT_COORDINATES } from '@/lib/constants/vibes'
import { fetchNearbyRestaurants } from '@/lib/utils/queryRestaurants'
import { getExcludedRestaurantIds, getSavedUserLocation, saveUserLocation } from '@/lib/utils/storage'
import { getDistrictLabelFromCoords } from '@/lib/utils/maps'

const MAX_SWAPS = 5

export default function SoloPage() {
  // 1. Tọa độ người dùng (Mặc định Trung tâm Q1, có thể đổi sang Q7 hoặc lấy GPS)
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(DEFAULT_COORDINATES)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  // 2. Bộ lọc tích cực (Multi-select Vibes & Parking & Google Price Tiers)
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersState>({
    vibes: [],
    parking: 'none',
    radiusMeters: 5000, // Mặc định 5km
    cuisine: null,
    priceTiers: [] // Trống = Tất cả mức giá
  })

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // 3. Danh sách quán gợi ý & trạng thái hiển thị
  const [restaurantPool, setRestaurantPool] = useState<RestaurantWithDistance[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSwaps, setRemainingSwaps] = useState(MAX_SWAPS)
  const [isLoading, setIsLoading] = useState(false)

  // 4. Modal chốt đơn
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [confirmedRestaurant, setConfirmedRestaurant] = useState<RestaurantWithDistance | null>(null)

  // Phát hiện GPS thiết bị thực tế (Độ chính xác cao, không cache cũ)
  const handleDetectGps = useCallback(async (options?: { silent?: boolean }) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!options?.silent) {
        alert('Trình duyệt của bạn không hỗ trợ Geolocation.')
      }
      return
    }

    setIsDetectingGps(true)

    const onGpsSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const accuracy = position.coords.accuracy

      const districtName = getDistrictLabelFromCoords(lat, lng)
      const coords: Coordinates = {
        lat,
        lng,
        accuracy,
        addressLabel: `${districtName} (GPS)`
      }

      setCurrentLocation(coords)
      saveUserLocation(coords)
      setIsDetectingGps(false)
    }

    const onGpsError = (error: GeolocationPositionError) => {
      console.warn('Lỗi lấy GPS:', error.message)
      setIsDetectingGps(false)
      if (!options?.silent) {
        alert('Không lấy được GPS tự động. Bạn có thể chọn nhanh khu vực "Quận 7" hoặc "Quận 1" trong danh sách nhé!')
      }
    }

    // 1. Luôn ưu tiên độ chính xác cao nhất (Hardware GPS / WiFi)
    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      () => {
        // Fallback nhẹ nếu enableHighAccuracy bị timeout
        navigator.geolocation.getCurrentPosition(
          onGpsSuccess,
          onGpsError,
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 }
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Khôi phục vị trí đã lưu và tự động cập nhật GPS tươi mới nhất khi vào app
  useEffect(() => {
    const saved = getSavedUserLocation()
    if (saved) {
      setCurrentLocation(saved)
    }
    handleDetectGps({ silent: true })
  }, [handleDetectGps])

  // Tìm kiếm danh sách quán (TUÂN THỦ BÁN KÍNH NGHIÊM NGẶT - LỆCH TỐI ĐA ~200M)
  const loadRestaurants = useCallback(async () => {
    setIsLoading(true)
    const excludeIds = getExcludedRestaurantIds()

    const results = await fetchNearbyRestaurants({
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      activeFilters,
      excludeIds
    })

    // Xáo trộn nhẹ kết quả trong phạm vi bán kính
    const shuffled = [...results].sort(() => Math.random() - 0.5)

    setRestaurantPool(shuffled)
    setCurrentIndex(0)
    setRemainingSwaps(MAX_SWAPS)
    setIsLoading(false)
  }, [currentLocation, activeFilters])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  // Toggle 1 thẻ Vibe (Multi-select)
  const handleToggleVibe = (vibeKey: VibeKey) => {
    setActiveFilters((prev) => {
      const exists = prev.vibes.includes(vibeKey)
      const nextVibes = exists
        ? prev.vibes.filter((v) => v !== vibeKey)
        : [...prev.vibes, vibeKey]

      return {
        ...prev,
        vibes: nextVibes
      }
    })
  }

  // Thay đổi filter Chỗ đỗ xe (Parking)
  const handleChangeParkingFilter = (parking: ParkingFilterOption) => {
    setActiveFilters((prev) => ({
      ...prev,
      parking
    }))
  }

  // Chọn "Gì cũng được!" (Random) -> Xóa toàn bộ filter
  const handleSelectRandom = () => {
    setActiveFilters((prev) => ({
      ...prev,
      vibes: [],
      parking: 'none',
      cuisine: null,
      priceTiers: []
    }))
  }

  // Đổi sang quán khác trong pool
  const handleSwap = () => {
    if (remainingSwaps <= 0 || restaurantPool.length <= 1) return
    setRemainingSwaps((prev) => prev - 1)
    setCurrentIndex((prev) => (prev + 1) % restaurantPool.length)
  }

  // Chốt quán
  const handleConfirm = (restaurant: RestaurantWithDistance) => {
    setConfirmedRestaurant(restaurant)
    setIsDecisionModalOpen(true)
  }

  // Nới rộng bán kính nhanh khi không có quán
  const handleExpandRadius = (newRadius: number) => {
    setActiveFilters((prev) => ({
      ...prev,
      radiusMeters: newRadius
    }))
  }

  const currentRestaurant = restaurantPool[currentIndex] || null

  const isAdvancedFilterActive =
    activeFilters.radiusMeters !== 5000 ||
    activeFilters.cuisine !== null ||
    activeFilters.priceTiers.length > 0

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Header Bar */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={(coords) => {
          setCurrentLocation(coords)
          saveUserLocation(coords)
        }}
        onDetectGps={() => handleDetectGps({ silent: false })}
        isDetectingGps={isDetectingGps}
      />

      {/* Grid thẻ Vibe (Multi-select) + Card Chỗ đỗ xe + Card Random */}
      <VibeGrid
        selectedVibes={activeFilters.vibes}
        onToggleVibe={handleToggleVibe}
        parkingFilter={activeFilters.parking}
        onChangeParkingFilter={handleChangeParkingFilter}
        onSelectRandom={handleSelectRandom}
        onOpenAdvancedFilter={() => setIsFilterModalOpen(true)}
        isAdvancedFilterActive={isAdvancedFilterActive}
      />

      {/* Hiển thị ĐÚNG 1 THẺ QUÁN ĂN NỔI BẬT NHẤT (Tuân thủ bán kính ~200m) */}
      <RestaurantCard
        restaurant={currentRestaurant}
        remainingSwaps={remainingSwaps}
        maxSwaps={MAX_SWAPS}
        onSwapRestaurant={handleSwap}
        onConfirmRestaurant={handleConfirm}
        isLoading={isLoading}
        radiusMeters={activeFilters.radiusMeters}
        onExpandRadius={handleExpandRadius}
      />

      {/* Modal Bộ lọc nâng cao */}
      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={activeFilters}
        onApplyFilters={(filters) => setActiveFilters(filters)}
        onResetFilters={() =>
          setActiveFilters({
            vibes: [],
            parking: 'none',
            radiusMeters: 5000,
            cuisine: null,
            priceTiers: []
          })
        }
      />

      {/* Modal Chốt quán thành công */}
      <DecisionModal
        restaurant={confirmedRestaurant}
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        userLocation={currentLocation}
      />
    </div>
  )
}
