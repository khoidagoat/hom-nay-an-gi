'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Wind, Car, Bike, RefreshCw, CheckCircle2, Sparkles, AlertCircle, Star, ArrowUpRight, Flag } from 'lucide-react'
import { RestaurantWithDistance } from '@/types'
import { formatDistance } from '@/lib/utils/maps'
import { GOOGLE_PRICE_TIERS } from '@/lib/constants/cuisines'
import ReportModal from './ReportModal'

const DEFAULT_FOOD_IMAGE = '/images/food/default.webp'

interface RestaurantCardProps {
  restaurant: RestaurantWithDistance | null
  remainingSwaps: number
  maxSwaps: number
  onSwapRestaurant: () => void
  onConfirmRestaurant: (restaurant: RestaurantWithDistance) => void
  isLoading: boolean
  radiusMeters: number
  onExpandRadius?: (newRadius: number) => void
}

export default function RestaurantCard({
  restaurant,
  remainingSwaps,
  maxSwaps,
  onSwapRestaurant,
  onConfirmRestaurant,
  isLoading,
  radiusMeters,
  onExpandRadius
}: RestaurantCardProps) {
  const [direction, setDirection] = useState(1)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [restaurant?.id])

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex-1 flex flex-col justify-center items-center min-h-[420px]">
        <div className="w-16 h-16 rounded-2xl bg-bistro-mustard border-2 border-bistro-ink shadow-[4px_4px_0px_#1C1917] flex items-center justify-center animate-bounce">
          <RefreshCw className="w-8 h-8 text-bistro-ink animate-spin" />
        </div>
        <p className="mt-4 font-display font-bold text-base text-bistro-ink">Đang xào nấu quán ngon...</p>
        <p className="text-xs text-bistro-muted">Trong bán kính {(radiusMeters / 1000).toFixed(0)}km quanh bạn</p>
      </div>
    )
  }

  // Khi không có quán nào thỏa mãn bán kính và bộ lọc
  if (!restaurant) {
    return (
      <div className="px-4 py-6 flex-1 flex flex-col justify-center items-center text-center min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-stone-200 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] flex items-center justify-center mb-3">
          <AlertCircle className="w-7 h-7 text-bistro-muted" />
        </div>
        <h3 className="font-display font-bold text-lg text-bistro-ink">
          Không có quán trong bán kính {(radiusMeters / 1000).toFixed(0)}km!
        </h3>
        <p className="text-xs text-bistro-muted max-w-[280px] mt-1 mb-4 leading-relaxed">
          Không tìm thấy quán phù hợp quanh vị trí này. Bạn thử nới rộng bán kính xem sao nhé:
        </p>

        {onExpandRadius && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {radiusMeters < 3000 && (
              <button
                onClick={() => onExpandRadius(3000)}
                className="tactile-btn py-2 px-3 rounded-xl bg-bistro-mustard text-bistro-ink text-xs font-bold flex items-center gap-1"
              >
                <span>Nới lên 3 km</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            {radiusMeters < 5000 && (
              <button
                onClick={() => onExpandRadius(5000)}
                className="tactile-btn py-2 px-3 rounded-xl bg-bistro-paper text-bistro-ink text-xs font-bold flex items-center gap-1"
              >
                <span>Nới lên 5 km</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            {radiusMeters < 10000 && (
              <button
                onClick={() => onExpandRadius(10000)}
                className="tactile-btn py-2 px-3 rounded-xl bg-bistro-paper text-bistro-ink text-xs font-bold flex items-center gap-1"
              >
                <span>Nới lên 10 km</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Lấy ký hiệu Google Price Tier
  const priceOption = GOOGLE_PRICE_TIERS.find((p) => p.tier === restaurant.price_level)
  const priceSymbol = priceOption?.symbol || '$'

  const getSwapHint = () => {
    if (remainingSwaps === 0) {
      return '⛔ Hết lượt đổi rồi! Trời định quán này rồi, triển ngay thôi!'
    }
    if (remainingSwaps === 1) {
      return '⚠️ Còn đúng 1 lượt thôi đó, đừng kén cá chọn canh nữa nha!'
    }
    if (remainingSwaps === 2) {
      return '⚡ Còn 2 lượt đổi, chuẩn bị chốt kèo đi ăn thôi!'
    }
    return `Đổi quán khác (còn ${remainingSwaps}/${maxSwaps} lượt)`
  }

  const handleSwapClick = () => {
    if (remainingSwaps <= 0) return
    setDirection(direction === 1 ? -1 : 1)
    onSwapRestaurant()
  }

  return (
    <div className="px-4 py-2 flex-1 flex flex-col justify-between">
      {/* Polaroid Restaurant Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={restaurant.id}
          initial={{ opacity: 0, x: direction * 50, rotate: direction * 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -direction * 50, rotate: -direction * 2 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="tactile-card bg-bistro-paper rounded-2xl p-3 relative flex flex-col"
        >
          {/* Food Photo with Corner Stickers */}
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-bistro-ink/20 bg-stone-100">
            <Image
              src={imgError ? DEFAULT_FOOD_IMAGE : (restaurant.image_url || DEFAULT_FOOD_IMAGE)}
              alt={restaurant.name}
              fill
              sizes="(max-width: 430px) 100vw, 400px"
              priority
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />

            {/* Sticker 1: Khoảng cách (Góc trên trái) */}
            <div className="absolute top-2.5 left-2.5 tactile-badge bg-bistro-mustard px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-bistro-ink" />
              <span className="font-mono text-xs font-bold text-bistro-ink tracking-tight">
                {formatDistance(restaurant.distance_meters)}
              </span>
            </div>

            {/* Sticker 2: Mức giá Google & Khoảng giá (Góc trên phải) */}
            <div className="absolute top-2.5 right-2.5 tactile-badge bg-bistro-cream px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs">
              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
                {priceSymbol}
              </span>
              <span className="font-mono text-xs font-bold text-bistro-ink tracking-tight">
                {restaurant.price_range_text}
              </span>
            </div>

            {/* Sticker 3: Rating sao Google & Review count (Góc dưới phải) */}
            <div className="absolute bottom-2.5 right-2.5 bg-bistro-ink/85 backdrop-blur-xs text-white px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-xs">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-mono text-xs font-extrabold text-amber-300">
                {restaurant.rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-300 font-mono">
                ({restaurant.review_count >= 1000 ? `${(restaurant.review_count / 1000).toFixed(1)}k` : restaurant.review_count})
              </span>
            </div>

            {/* Cuisine badge & Illustration badge (Góc dưới trái) */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
              <div className="bg-bistro-ink/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                {restaurant.cuisine}
              </div>
              {restaurant.is_real_image === false && (
                <div className="bg-black/60 backdrop-blur-xs text-stone-200 text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-white/10">
                  Ảnh minh họa món
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết quán */}
          <div className="pt-3 pb-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display font-extrabold text-xl text-bistro-ink leading-snug">
                {restaurant.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="shrink-0 p-1.5 rounded-lg text-bistro-muted hover:text-bistro-sriracha hover:bg-stone-100 transition-colors flex items-center gap-1 text-[11px] font-mono"
                title="Báo lỗi quán"
                aria-label="Báo lỗi thông tin quán"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Báo lỗi</span>
              </button>
            </div>

            {/* Địa chỉ */}
            <p className="text-xs text-bistro-muted flex items-center gap-1 mb-2.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-bistro-muted shrink-0" />
              <span>{restaurant.address}</span>
            </p>

            {/* Lý do đề xuất */}
            {restaurant.description && (
              <div className="bg-bistro-cream/70 border border-bistro-border rounded-xl p-2.5 mb-2.5 text-xs text-bistro-ink font-medium leading-relaxed flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-bistro-sriracha shrink-0 mt-0.5" />
                <span>{restaurant.description}</span>
              </div>
            )}

            {/* Badges Tiện ích */}
            <div className="flex flex-wrap items-center gap-1.5">
              {restaurant.has_ac && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md">
                  <Wind className="w-3 h-3 text-sky-600" />
                  Máy lạnh
                </span>
              )}
              {restaurant.has_car_parking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                  <Car className="w-3 h-3 text-purple-600" />
                  Đậu ô tô
                </span>
              )}
              {restaurant.free_moto_parking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <Bike className="w-3 h-3 text-emerald-600" />
                  Giữ xe free
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons Section */}
      <div className="mt-4 space-y-2">
        {/* Remaining swaps indicator */}
        <div className="text-center">
          <span className={`text-[11px] font-bold ${remainingSwaps <= 1 ? 'text-bistro-sriracha animate-pulse' : 'text-bistro-muted'}`}>
            {getSwapHint()}
          </span>
        </div>

        {/* Buttons grid */}
        <div className="grid grid-cols-5 gap-2">
          {/* Button 1: Đổi quán khác (Chiếm 2 cột) */}
          <button
            onClick={handleSwapClick}
            disabled={remainingSwaps <= 0}
            className={`col-span-2 tactile-btn py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
              remainingSwaps <= 0
                ? 'bg-stone-200 text-stone-400 border-stone-300 shadow-none cursor-not-allowed'
                : 'bg-bistro-paper hover:bg-stone-50 text-bistro-ink'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${remainingSwaps > 0 ? 'text-bistro-ink' : ''}`} />
            <span>Đổi quán</span>
          </button>

          {/* Button 2: Chốt quán này! (Chiếm 3 cột, Primary CTA Sriracha) */}
          <button
            onClick={() => onConfirmRestaurant(restaurant)}
            className="col-span-3 tactile-btn py-3 px-4 rounded-xl font-bold text-sm bg-bistro-sriracha hover:bg-[#d63f1e] text-white flex items-center justify-center gap-2 shadow-[3px_3px_0px_#1C1917]"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Chốt quán này!</span>
          </button>
        </div>
      </div>

      {/* Modal Báo lỗi thông tin quán */}
      <ReportModal
        restaurant={restaurant}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReportSuccess={(reason) => {
          if ((reason === 'closed' || reason === 'wrong_address') && remainingSwaps > 0) {
            handleSwapClick()
          }
        }}
      />
    </div>
  )
}
