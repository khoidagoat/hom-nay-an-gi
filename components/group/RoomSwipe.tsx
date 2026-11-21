'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { MapPin, Star, ThumbsUp, ThumbsDown, Users, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { RestaurantWithDistance, RoomParticipant, VotingRoom } from '@/types'
import { formatDistance } from '@/lib/utils/maps'
import { GOOGLE_PRICE_TIERS } from '@/lib/constants/cuisines'

interface RoomSwipeProps {
  room: VotingRoom
  voterName: string
  restaurants: RestaurantWithDistance[]
  participants: RoomParticipant[]
  onVote: (restaurantId: string, isLike: boolean) => Promise<void>
  onForceComplete?: () => void
  isHost?: boolean
}

interface SwipeCardProps {
  restaurant: RestaurantWithDistance
  priceSymbol: string
  onSwipe: (isLike: boolean) => void
  swipeTrigger: 'left' | 'right' | null
  disabled?: boolean
}

/**
 * Thẻ quán ăn độc lập (Mỗi thẻ có MotionValue riêng biệt)
 * Khắc phục triệt để lỗi thẻ sau bị lệch/nghiêng do tái sử dụng MotionValue từ thẻ trước
 */
const DEFAULT_FOOD_IMAGE = '/images/food/default.webp'

function SwipeCard({
  restaurant,
  priceSymbol,
  onSwipe,
  swipeTrigger,
  disabled
}: SwipeCardProps) {
  const [imgError, setImgError] = useState(false)
  // Motion values riêng biệt cho từng thẻ
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const opacityLike = useTransform(x, [20, 90], [0, 1])
  const opacityNope = useTransform(x, [-20, -90], [0, 1])

  const hasVoted = useRef(false)

  const handleCompleteSwipe = (isLike: boolean) => {
    if (hasVoted.current) return
    hasVoted.current = true
    onSwipe(isLike)
  }

  // Lắng nghe khi bấm nút bên ngoài (Chê 👎 hoặc Ăn được 👍)
  useEffect(() => {
    if (!swipeTrigger || hasVoted.current) return

    if (swipeTrigger === 'right') {
      animate(x, 420, {
        duration: 0.22,
        ease: 'easeOut',
        onComplete: () => handleCompleteSwipe(true)
      })
    } else if (swipeTrigger === 'left') {
      animate(x, -420, {
        duration: 0.22,
        ease: 'easeOut',
        onComplete: () => handleCompleteSwipe(false)
      })
    }
  }, [swipeTrigger])

  // Xử lý khi người dùng quẹt bằng ngón tay / chuột
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (disabled || hasVoted.current) return

    if (info.offset.x > 80 || info.velocity.x > 500) {
      // Quẹt phải (Ăn được)
      animate(x, 420, {
        duration: 0.22,
        ease: 'easeOut',
        onComplete: () => handleCompleteSwipe(true)
      })
    } else if (info.offset.x < -80 || info.velocity.x < -500) {
      // Quẹt trái (Chê)
      animate(x, -420, {
        duration: 0.22,
        ease: 'easeOut',
        onComplete: () => handleCompleteSwipe(false)
      })
    } else {
      // Nhả tay ra khi chưa kéo đủ xa: Trượt êm về giữa (x = 0)
      animate(x, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 25
      })
    }
  }

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="absolute inset-0 tactile-card bg-bistro-paper rounded-2xl p-3 border-2 border-bistro-ink shadow-[5px_5px_0px_#1C1917] flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden z-10"
    >
      {/* Visual Stamp Stickers khi kéo */}
      <motion.div
        style={{ opacity: opacityLike }}
        className="absolute top-6 left-6 z-20 pointer-events-none border-4 border-bistro-herb text-bistro-herb font-display font-black text-2xl uppercase px-4 py-1.5 rounded-xl rotate-[-15deg] shadow-lg bg-white/95"
      >
        ĂN ĐƯỢC 👍
      </motion.div>

      <motion.div
        style={{ opacity: opacityNope }}
        className="absolute top-6 right-6 z-20 pointer-events-none border-4 border-bistro-sriracha text-bistro-sriracha font-display font-black text-2xl uppercase px-4 py-1.5 rounded-xl rotate-[15deg] shadow-lg bg-white/95"
      >
        CHÊ 👎
      </motion.div>

      {/* Ảnh món ăn 4:3 */}
      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-bistro-ink/20 bg-stone-100">
        <Image
          src={imgError ? DEFAULT_FOOD_IMAGE : (restaurant.image_url || DEFAULT_FOOD_IMAGE)}
          alt={restaurant.name}
          fill
          sizes="(max-width: 430px) 100vw, 400px"
          priority
          className="object-cover pointer-events-none"
          onError={() => setImgError(true)}
          unoptimized
        />

        {/* Badges trên ảnh */}
        <div className="absolute top-2.5 left-2.5 bg-bistro-mustard border border-bistro-ink px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs font-mono text-xs font-bold text-bistro-ink">
          <MapPin className="w-3.5 h-3.5 text-bistro-ink" />
          <span>{formatDistance(restaurant.distance_meters)}</span>
        </div>

        <div className="absolute top-2.5 right-2.5 bg-bistro-cream border border-bistro-ink px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs font-mono text-xs font-bold text-bistro-ink">
          <span className="font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
            {priceSymbol}
          </span>
          <span>{restaurant.price_range_text}</span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 bg-bistro-ink/85 backdrop-blur-xs text-white px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-xs font-mono text-xs font-bold">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-amber-300">{restaurant.rating.toFixed(1)}</span>
        </div>

        {/* Badge Ảnh minh họa nếu là ảnh stock */}
        {restaurant.is_real_image === false && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-stone-200 text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-white/10">
            Ảnh minh họa món
          </div>
        )}
      </div>

      {/* Thông tin quán */}
      <div className="pt-3 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-bistro-sriracha bg-bistro-sriracha/10 px-2 py-0.5 rounded border border-bistro-sriracha/30">
            {restaurant.cuisine}
          </span>
          {restaurant.has_ac && (
            <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              ❄️ Máy lạnh
            </span>
          )}
          {restaurant.has_car_parking && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              🚗 Đỗ ô tô
            </span>
          )}
        </div>

        <h3 className="font-display font-extrabold text-xl text-bistro-ink truncate">
          {restaurant.name}
        </h3>

        <p className="text-xs text-bistro-muted truncate mt-0.5">
          {restaurant.address}
        </p>

        {restaurant.description && (
          <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 italic bg-bistro-cream/60 p-1.5 rounded-lg border border-bistro-border">
            &ldquo;{restaurant.description}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function RoomSwipe({
  room,
  voterName,
  restaurants,
  participants,
  onVote,
  onForceComplete,
  isHost
}: RoomSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeTrigger, setSwipeTrigger] = useState<'left' | 'right' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = restaurants.length
  const currentRestaurant = restaurants[currentIndex]
  const nextRestaurant = currentIndex + 1 < total ? restaurants[currentIndex + 1] : null
  const isFinished = currentIndex >= total

  // Kích hoạt khi quẹt xong 1 thẻ (từ drag hoặc từ nút bấm)
  const handleSwipe = async (isLike: boolean) => {
    const votedRestaurant = currentRestaurant
    if (!votedRestaurant) return

    // Chuyển sang quán kế tiếp ngay lập tức, reset trigger
    setCurrentIndex((prev) => prev + 1)
    setSwipeTrigger(null)
    setIsSubmitting(false)

    // Gửi vote lên hệ thống ở background
    try {
      await onVote(votedRestaurant.id, isLike)
    } catch (e) {
      console.warn('Lỗi ghi vote:', e)
    }
  }

  // Trigger quẹt từ nút bấm
  const handleButtonAction = (isLike: boolean) => {
    if (isSubmitting || !currentRestaurant) return
    setIsSubmitting(true)
    setSwipeTrigger(isLike ? 'right' : 'left')
  }

  // 1. Màn hình chờ khi người dùng đã quẹt xong cả 10 quán
  if (isFinished || !currentRestaurant) {
    const finishedCount = participants.filter((p) => p.isDone).length
    const totalCount = Math.max(1, participants.length)

    return (
      <div className="w-full max-w-[430px] mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-bistro-mustard border-2 border-bistro-ink shadow-[4px_4px_0px_#1C1917] flex items-center justify-center text-4xl mb-4 animate-bounce">
          🎉
        </div>
        <h3 className="font-display font-extrabold text-2xl text-bistro-ink">
          Bạn đã quẹt xong 10 quán!
        </h3>
        <p className="text-xs text-bistro-muted max-w-[280px] mt-1 mb-6 leading-relaxed">
          Đang chờ đồng bọn trong phòng hoàn thành lượt quẹt để chốt hóa đơn nhé...
        </p>

        {/* Thanh tiến độ phòng */}
        <div className="w-full bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917] mb-6 text-left">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-bistro-ink mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-bistro-sriracha" />
              <span>TIẾN ĐỘ CẢ PHÒNG</span>
            </span>
            <span>{finishedCount}/{totalCount} đã xong</span>
          </div>

          <div className="w-full h-3 bg-stone-200 rounded-full border border-bistro-ink overflow-hidden p-0.5">
            <div
              className="h-full bg-bistro-herb rounded-full transition-all duration-300"
              style={{ width: `${(finishedCount / totalCount) * 100}%` }}
            />
          </div>

          {/* Danh sách người tham gia */}
          <div className="mt-4 space-y-2 border-t border-bistro-border pt-3">
            {participants.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-bistro-herb inline-block" />
                  <span>{p.name} {p.isHost && '👑'} {p.name === voterName && '(Bạn)'}</span>
                </span>
                {p.isDone ? (
                  <span className="text-bistro-herb font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã xong</span>
                  </span>
                ) : (
                  <span className="text-bistro-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{p.votedCount}/{total} quán</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nút Host chốt kết quả ngay nếu không muốn chờ thêm */}
        {isHost && onForceComplete && (
          <button
            onClick={onForceComplete}
            className="w-full tactile-btn bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chốt kết quả ngay (Không đợi thêm)</span>
          </button>
        )}
      </div>
    )
  }

  // 2. Màn hình quẹt thẻ
  const priceOption = GOOGLE_PRICE_TIERS.find((p) => p.tier === currentRestaurant.price_level)
  const priceSymbol = priceOption?.symbol || '$'

  return (
    <div className="w-full max-w-[430px] mx-auto px-4 py-2 flex-1 flex flex-col justify-between select-none">
      {/* Top Header: Thanh tiến độ & Member Chips */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono font-bold text-bistro-ink mb-1.5">
          <span className="bg-bistro-paper px-2.5 py-1 rounded-lg border border-bistro-ink shadow-xs">
            Quán {currentIndex + 1} / {total}
          </span>
          <span className="text-bistro-muted text-[11px]">
            {participants.length} người đang quẹt
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-stone-200 rounded-full border border-bistro-ink overflow-hidden p-0.2 mb-3">
          <div
            className="h-full bg-bistro-sriracha rounded-full transition-all duration-200"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Tinder Card Container */}
      <div className="relative w-full aspect-[4/5] max-h-[460px] my-auto">
        {/* Thẻ xếp tầng phía dưới (Next Card preview) */}
        {nextRestaurant && (
          <div className="absolute inset-0 tactile-card bg-bistro-paper/90 rounded-2xl p-3 border-2 border-bistro-ink/40 shadow-[2px_2px_0px_#1C1917] flex flex-col justify-between overflow-hidden scale-[0.96] translate-y-2 pointer-events-none z-0">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-bistro-ink/10 bg-stone-100">
              <Image
                src={nextRestaurant.image_url}
                alt={nextRestaurant.name}
                fill
                sizes="(max-width: 430px) 100vw, 400px"
                className="object-cover"
              />
            </div>
            <div className="pt-3 pb-1">
              <h3 className="font-display font-extrabold text-xl text-bistro-ink/70 truncate">
                {nextRestaurant.name}
              </h3>
              <p className="text-xs text-bistro-muted truncate mt-0.5">
                {nextRestaurant.address}
              </p>
            </div>
          </div>
        )}

        {/* Thẻ đang quẹt (Top Card) */}
        <SwipeCard
          key={currentRestaurant.id}
          restaurant={currentRestaurant}
          priceSymbol={priceSymbol}
          onSwipe={handleSwipe}
          swipeTrigger={swipeTrigger}
          disabled={isSubmitting}
        />
      </div>

      {/* Floating Action Buttons: Chê 👎 vs Ăn luôn 👍 */}
      <div className="flex items-center justify-center gap-6 pt-3 pb-1">
        {/* Nút Quẹt Trái (Chê) */}
        <button
          onClick={() => handleButtonAction(false)}
          disabled={isSubmitting}
          className="w-16 h-16 rounded-full bg-bistro-paper hover:bg-rose-50 text-bistro-sriracha border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Chê món này"
        >
          <ThumbsDown className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Nút Quẹt Phải (Ăn được) */}
        <button
          onClick={() => handleButtonAction(true)}
          disabled={isSubmitting}
          className="w-16 h-16 rounded-full bg-bistro-sriracha hover:bg-[#d63f1e] text-white border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Ăn được món này"
        >
          <ThumbsUp className="w-7 h-7 stroke-[2.5] fill-white" />
        </button>
      </div>
    </div>
  )
}
