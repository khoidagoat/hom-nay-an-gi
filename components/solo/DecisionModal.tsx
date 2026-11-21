'use client'

import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { MapPin, Navigation, Copy, Check, X, ExternalLink, Star } from 'lucide-react'
import { RestaurantWithDistance, Coordinates } from '@/types'
import { getGoogleMapsDirectionsUrl, getGoogleMapsSearchUrl, copyToClipboard } from '@/lib/utils/maps'
import { saveMealToHistory } from '@/lib/utils/storage'

interface DecisionModalProps {
  restaurant: RestaurantWithDistance | null
  isOpen: boolean
  onClose: () => void
  userLocation?: Coordinates | null
}

export default function DecisionModal({
  restaurant,
  isOpen,
  onClose,
  userLocation
}: DecisionModalProps) {
  const [copiedName, setCopiedName] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    if (isOpen && restaurant) {
      // Bắn pháo giấy ăn mừng
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E84A27', '#F4B942', '#2A7B56', '#1C1917']
      })

      // Lưu tự động vào lịch sử 7 ngày (để lần sau app tự động né quán trùng)
      saveMealToHistory(restaurant.id, restaurant.name, restaurant.cuisine, {
        address: restaurant.address,
        image_url: restaurant.image_url,
        price_range_text: restaurant.price_range_text,
        rating: restaurant.rating
      })
    }
  }, [isOpen, restaurant])

  if (!isOpen || !restaurant) return null

  const handleCopyName = async () => {
    const success = await copyToClipboard(restaurant.name)
    if (success) {
      setCopiedName(true)
      setTimeout(() => setCopiedName(false), 2500)
    }
  }

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(restaurant.address)
    if (success) {
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2500)
    }
  }

  // Mở chế độ Chỉ đường (Directions) trực tiếp từ GPS hiện tại tới Tên quán + Địa chỉ thực tế
  const handleOpenGoogleMapsDirections = () => {
    const url = getGoogleMapsDirectionsUrl(
      restaurant.lat,
      restaurant.lng,
      restaurant.name,
      restaurant.address,
      userLocation?.lat,
      userLocation?.lng
    )
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Mở trang chi tiết cơ sở kinh doanh trên Google Maps (Xem ảnh, review, thực đơn)
  const handleOpenGoogleMapsSearch = () => {
    const url = getGoogleMapsSearchUrl(restaurant.name, restaurant.address)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bistro-ink/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-bistro-cream border-[2px] border-bistro-ink rounded-t-3xl sm:rounded-3xl shadow-[5px_5px_0px_#1C1917] p-6 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bistro-paper border border-bistro-ink flex items-center justify-center hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-bistro-ink" />
          </button>
        </div>

        {/* Celebration Header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-bistro-mustard border-[1.5px] border-bistro-ink shadow-[3px_3px_0px_#1C1917] flex items-center justify-center text-3xl">
            🎉
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-bistro-sriracha bg-bistro-sriracha/10 px-2.5 py-1 rounded-full border border-bistro-sriracha/30 inline-block mb-1.5">
            ĐÃ CHỐT KÈO ĂN UỐNG!
          </span>
          <h3 className="font-display font-extrabold text-2xl text-bistro-ink leading-tight">
            {restaurant.name}
          </h3>

          {/* Rating & Review badge */}
          {restaurant.rating && (
            <div className="flex items-center justify-center gap-1 mt-1 text-xs font-mono font-bold text-bistro-ink">
              <Star className="w-3.5 h-3.5 fill-bistro-mustard text-bistro-ink stroke-[1.5]" />
              <span>{restaurant.rating.toFixed(1)}</span>
              <span className="text-bistro-muted font-normal">({restaurant.review_count || 120} đánh giá)</span>
            </div>
          )}

          {/* Address box */}
          <div className="mt-3 p-3 bg-bistro-paper/80 rounded-xl border border-bistro-border text-left flex items-start gap-2">
            <MapPin className="w-4 h-4 text-bistro-sriracha shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-bistro-ink leading-snug">
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Action 1: Chỉ đường Google Maps */}
          <button
            onClick={handleOpenGoogleMapsDirections}
            className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Chỉ đường trên Google Maps</span>
          </button>

          {/* Action 2: Xem ảnh & đánh giá quán trên Google Maps */}
          <button
            onClick={handleOpenGoogleMapsSearch}
            className="w-full tactile-btn bg-bistro-mustard hover:bg-[#eab039] text-bistro-ink font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Xem ảnh & đánh giá quán trên Google Maps</span>
          </button>

          {/* Action 3: Hàng nút tiện ích Copy */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Copy Tên quán */}
            <button
              onClick={handleCopyName}
              className="tactile-btn bg-bistro-paper hover:bg-stone-50 text-bistro-ink font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs border-[1.5px] border-bistro-ink"
            >
              {copiedName ? (
                <>
                  <Check className="w-3.5 h-3.5 text-bistro-herb stroke-[3]" />
                  <span className="text-bistro-herb text-[11px]">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-bistro-muted" />
                  <span className="text-[11px] truncate">Copy tên quán</span>
                </>
              )}
            </button>

            {/* Copy Địa chỉ quán */}
            <button
              onClick={handleCopyAddress}
              className="tactile-btn bg-bistro-paper hover:bg-stone-50 text-bistro-ink font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs border-[1.5px] border-bistro-ink"
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-bistro-herb stroke-[3]" />
                  <span className="text-bistro-herb text-[11px]">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-bistro-muted" />
                  <span className="text-[11px] truncate">Copy địa chỉ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
