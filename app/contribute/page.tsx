'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Check,
  PlusCircle,
  Wind,
  Car,
  Bike,
  Image as ImageIcon,
  Loader2,
  Navigation,
  Camera,
  Upload,
  AlertTriangle,
  Eye,
  X,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'
import Header from '@/components/common/Header'
import { GooglePriceTier, RestaurantWithDistance } from '@/types'
import { GOOGLE_PRICE_TIERS } from '@/lib/constants/cuisines'
import { detectSubCuisine, getImageForSubCuisine } from '@/lib/utils/foodKeywords'
import { getDistrictLabelFromCoords, getCoordsFromAddress } from '@/lib/utils/maps'
import { findDuplicateRestaurant, DuplicateMatch } from '@/lib/utils/duplicateDetector'
import { compressImage } from '@/lib/utils/imageCompressor'
import { supabase } from '@/lib/supabase/client'

const CUISINE_OPTIONS = [
  'Cơm',
  'Bún/Phở',
  'Lẩu/Nướng',
  'Đồ Nhật/Hàn',
  'Đồ Âu',
  'Ăn vặt',
  'Món Việt khác'
]

export default function ContributePage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [cuisine, setCuisine] = useState('Cơm')
  const [subCuisine, setSubCuisine] = useState('com_tam')
  const [priceLevel, setPriceLevel] = useState<GooglePriceTier>(1)
  const [hasAc, setHasAc] = useState(false)
  const [hasCarParking, setHasCarParking] = useState(false)
  const [freeMotoParking, setFreeMotoParking] = useState(true)
  const [shortReason, setShortReason] = useState('')
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [showCustomImageInput, setShowCustomImageInput] = useState(false)

  // Duplicate detection state
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null)
  const [dismissDuplicate, setDismissDuplicate] = useState(false)
  const [selectedExistingRestaurant, setSelectedExistingRestaurant] = useState<Omit<
    RestaurantWithDistance,
    'distance_meters'
  > | null>(null)

  // User uploaded / camera image state
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null)
  const [userImageBlob, setUserImageBlob] = useState<Blob | null>(null)
  const [userImageSizeKb, setUserImageSizeKb] = useState<number | null>(null)
  const [isCompressingImage, setIsCompressingImage] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // GPS state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingGps, setIsGettingGps] = useState(false)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRestaurant, setSubmittedRestaurant] = useState<{
    id: string
    name: string
    address: string
    cuisine: string
    price_range_text: string
    image_url: string
    is_real_image: boolean
  } | null>(null)

  // Khi người dùng gõ tên quán, tự động nhận diện món & ảnh minh họa
  const handleNameChange = (val: string) => {
    setName(val)
    if (val.trim().length >= 3) {
      const detected = detectSubCuisine(val)
      setCuisine(detected.cuisine)
      setSubCuisine(detected.sub_cuisine)
    }
  }

  // Quét tìm trùng lặp tự động (Debounce 350ms)
  useEffect(() => {
    if (name.trim().length < 3) {
      setDuplicateMatch(null)
      return
    }

    const timer = setTimeout(() => {
      const match = findDuplicateRestaurant(name, address, coords)
      setDuplicateMatch(match)
      setDismissDuplicate(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [name, address, coords])

  // Lấy GPS vị trí quán hiện tại của người dùng
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }

    setIsGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })

        const district = getDistrictLabelFromCoords(lat, lng)
        if (!address) {
          setAddress(`${district}, TP. Hồ Chí Minh`)
        }
        setIsGettingGps(false)
      },
      (err) => {
        console.warn('Lỗi định vị:', err)
        alert('Không lấy được GPS. Bạn có thể tự nhập địa chỉ (gồm số nhà, tên đường, quận) nhé!')
        setIsGettingGps(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Xử lý nén ảnh khi chụp từ Camera hoặc chọn từ Thư viện
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressingImage(true)
    try {
      const result = await compressImage(file, 800, 600, 0.8)
      setUserImagePreview(result.dataUrl)
      setUserImageBlob(result.blob)
      setUserImageSizeKb(result.sizeKb)
      // Xóa link URL custom nếu có
      setCustomImageUrl('')
      setShowCustomImageInput(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xử lý tệp ảnh này'
      alert(`Lỗi xử lý ảnh: ${msg}`)
    } finally {
      setIsCompressingImage(false)
      e.target.value = ''
    }
  }

  const handleClearUserImage = () => {
    setUserImagePreview(null)
    setUserImageBlob(null)
    setUserImageSizeKb(null)
  }

  // Xử lý gửi quán ăn mới
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !address.trim()) {
      alert('Vui lòng nhập tên quán và địa chỉ quán nhé!')
      return
    }

    setIsSubmitting(true)

    // 1. Xác định tọa độ (từ GPS hoặc suy luận từ tên Quận)
    const finalCoords = coords || getCoordsFromAddress(address)

    // 2. Xử lý ảnh: Ưu tiên ảnh chụp/tải lên của user
    let finalImage = getImageForSubCuisine(subCuisine)
    let isRealImage = false

    if (userImagePreview) {
      isRealImage = true
      finalImage = userImagePreview

      // Thử upload lên Supabase Storage bucket 'restaurant-images' nếu có cấu hình
      try {
        const isConfigured = Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-supabase')
        )
        if (isConfigured && userImageBlob) {
          const fileName = `ugc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`
          const { data, error } = await supabase.storage
            .from('restaurant-images')
            .upload(fileName, userImageBlob, {
              contentType: 'image/jpeg',
              upsert: true
            })
          if (!error && data) {
            const { data: pubData } = supabase.storage
              .from('restaurant-images')
              .getPublicUrl(fileName)
            finalImage = pubData.publicUrl
          }
        }
      } catch (uploadErr) {
        console.warn('Lỗi upload storage, fallback sang base64 dataUrl:', uploadErr)
      }
    } else if (customImageUrl.trim()) {
      finalImage = customImageUrl.trim()
      isRealImage = true
    }

    const priceObj = GOOGLE_PRICE_TIERS.find((p) => p.tier === priceLevel)
    const priceRangeText = priceObj ? priceObj.rangeText : 'Dưới 100k'
    const finalReason = shortReason.trim() || `Quán ${name.trim()} món ngon chuẩn vị Sài Gòn.`

    const newId = `ugc-${Date.now()}`

    const newRestaurant = {
      id: newId,
      name: name.trim(),
      address: address.trim(),
      lat: finalCoords.lat,
      lng: finalCoords.lng,
      cuisine,
      sub_cuisine: subCuisine,
      is_real_image: isRealImage,
      price_level: priceLevel,
      price_range_text: priceRangeText,
      rating: 4.6,
      review_count: 1,
      has_ac: hasAc,
      has_car_parking: hasCarParking,
      free_moto_parking: freeMotoParking,
      image_url: finalImage,
      vibe_tags: hasAc ? ['mat_me'] : ['cuoi_thang'],
      description: finalReason,
      short_reason: finalReason,
      source: 'ugc' as const,
      is_approved: true
    }

    // 3. Thử gửi lên Supabase nếu có cấu hình
    try {
      const isConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-supabase')
      )

      if (isConfigured) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('restaurants') as any).insert([
          {
            name: newRestaurant.name,
            address: newRestaurant.address,
            lat: newRestaurant.lat,
            lng: newRestaurant.lng,
            cuisine: newRestaurant.cuisine,
            sub_cuisine: newRestaurant.sub_cuisine,
            is_real_image: newRestaurant.is_real_image,
            price_level: newRestaurant.price_level,
            price_range_text: newRestaurant.price_range_text,
            rating: newRestaurant.rating,
            review_count: newRestaurant.review_count,
            has_ac: newRestaurant.has_ac,
            has_car_parking: newRestaurant.has_car_parking,
            free_moto_parking: newRestaurant.free_moto_parking,
            image_url: newRestaurant.image_url,
            vibe_tags: newRestaurant.vibe_tags,
            description: newRestaurant.description,
            short_reason: newRestaurant.short_reason,
            source: 'ugc',
            is_approved: true
          }
        ])
      }
    } catch (err) {
      console.warn('Lỗi ghi vào Supabase, chuyển sang lưu localStorage:', err)
    }

    // 4. Luôn lưu vào localStorage (Offline-first & xuất hiện ngay trong kết quả tìm kiếm)
    try {
      const existing = localStorage.getItem('contributed_restaurants')
      const list = existing ? JSON.parse(existing) : []
      list.unshift(newRestaurant)
      localStorage.setItem('contributed_restaurants', JSON.stringify(list))
    } catch (err) {
      console.warn('Lỗi lưu localStorage:', err)
    }

    // Bắn pháo giấy chúc mừng
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#E84A27', '#F4B942', '#2A7B56', '#1C1917']
    })

    setSubmittedRestaurant({
      id: newId,
      name: newRestaurant.name,
      address: newRestaurant.address,
      cuisine: newRestaurant.cuisine,
      price_range_text: newRestaurant.price_range_text,
      image_url: newRestaurant.image_url,
      is_real_image: isRealImage
    })

    setIsSubmitting(false)
  }

  // Reset form để góp quán tiếp theo
  const handleReset = () => {
    setName('')
    setAddress('')
    setCuisine('Cơm')
    setSubCuisine('com_tam')
    setPriceLevel(1)
    setHasAc(false)
    setHasCarParking(false)
    setFreeMotoParking(true)
    setShortReason('')
    setCustomImageUrl('')
    setShowCustomImageInput(false)
    setUserImagePreview(null)
    setUserImageBlob(null)
    setUserImageSizeKb(null)
    setDuplicateMatch(null)
    setDismissDuplicate(false)
    setCoords(null)
    setSubmittedRestaurant(null)
  }

  return (
    <div className="min-h-screen bg-bistro-cream flex flex-col justify-between">
      {/* Hidden file inputs cho Camera & Gallery */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <Header showLocationPill={false} />

      <main className="mobile-container pb-28 pt-2 px-4 flex-1">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-bistro-paper border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917] flex items-center justify-center text-bistro-ink hover:bg-stone-100 transition-colors"
            aria-label="Quay lại trang chủ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-xl text-bistro-ink tracking-tight flex items-center gap-1.5">
              <span>Góp quán ruột</span>
              <span className="text-bistro-sriracha">✨</span>
            </h1>
            <p className="text-[11px] text-bistro-muted leading-tight">
              Duyệt ngay lập tức • 0đ chi phí • Không cần đăng nhập
            </p>
          </div>
        </div>

        {submittedRestaurant ? (
          /* MÀN HÌNH CHÚC MỪNG KHI GÓP QUÁN THÀNH CÔNG */
          <div className="tactile-card bg-bistro-paper rounded-3xl p-6 border-2 border-bistro-ink shadow-[5px_5px_0px_#1C1917] text-center animate-in zoom-in-95 duration-200 mt-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-bistro-herb/15 border-2 border-bistro-herb flex items-center justify-center text-bistro-herb text-3xl">
              🎉
            </div>
            <h2 className="font-display font-extrabold text-2xl text-bistro-ink">
              Góp quán thành công!
            </h2>
            <p className="text-xs text-bistro-muted mt-1 mb-5">
              Quán ruột của bạn đã được thêm vào bản đồ ẩm thực và sẵn sàng xuất hiện trong lượt quay!
            </p>

            {/* Thẻ xem trước quán vừa thêm */}
            <div className="bg-white rounded-2xl p-3 border border-bistro-border text-left flex items-center gap-3 mb-6 shadow-xs">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-bistro-ink/10 bg-stone-100">
                <Image
                  src={submittedRestaurant.image_url}
                  alt={submittedRestaurant.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {submittedRestaurant.is_real_image && (
                  <div className="absolute bottom-1 left-1 bg-bistro-herb text-white text-[8px] font-bold px-1 rounded">
                    Ảnh thật
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-sm text-bistro-ink truncate">
                  {submittedRestaurant.name}
                </h3>
                <p className="text-[11px] text-bistro-muted truncate">
                  {submittedRestaurant.address}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-bistro-sriracha bg-bistro-sriracha/10 px-1.5 py-0.2 rounded border border-bistro-sriracha/30">
                    {submittedRestaurant.cuisine}
                  </span>
                  <span className="text-[10px] text-bistro-muted font-mono font-bold">
                    {submittedRestaurant.price_range_text}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Link
                href="/"
                className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Về trang chủ tìm quán ngay</span>
              </Link>
              <button
                onClick={handleReset}
                className="w-full tactile-btn bg-bistro-paper hover:bg-stone-50 text-bistro-ink font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs border-[1.5px] border-bistro-ink"
              >
                <PlusCircle className="w-4 h-4 text-bistro-ink" />
                <span>Góp thêm một quán khác</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN QUÁN */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Box 1: Tên & Địa chỉ */}
            <div className="tactile-card bg-bistro-paper rounded-2xl p-4 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] space-y-3">
              {/* Tên quán */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1">
                  Tên quán ăn <span className="text-bistro-sriracha">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Cơm Tấm Ba Ghiền, Phở Hòa..."
                  className="w-full text-sm font-semibold p-3 bg-white border-[1.5px] border-bistro-border rounded-xl focus:outline-hidden focus:border-bistro-ink transition-colors placeholder:text-stone-400 font-sans shadow-inner"
                />
              </div>

              {/* Banner cảnh báo phát hiện trùng quán */}
              {duplicateMatch && !dismissDuplicate && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-amber-900 leading-tight">
                          Hình như quán này đã có trên hệ thống!
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded shrink-0">
                          {duplicateMatch.similarity}% trùng
                        </span>
                      </div>
                      <p className="text-xs font-bold text-bistro-ink mt-1 truncate">
                        {duplicateMatch.restaurant.name}
                      </p>
                      <p className="text-[11px] text-stone-600 truncate">
                        {duplicateMatch.restaurant.address}
                      </p>
                      <p className="text-[10px] text-amber-800 italic mt-0.5">
                        {duplicateMatch.reason}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedExistingRestaurant(duplicateMatch.restaurant)}
                          className="tactile-btn py-1 px-2.5 rounded-lg bg-bistro-paper border border-bistro-ink text-[11px] font-bold text-bistro-ink flex items-center gap-1 hover:bg-white"
                        >
                          <Eye className="w-3.5 h-3.5 text-bistro-ink" />
                          <span>Xem quán này</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDismissDuplicate(true)}
                          className="text-[11px] text-stone-600 hover:text-stone-900 underline ml-1"
                        >
                          Đây là quán khác (Tiếp tục)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Địa chỉ quán */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink">
                    Địa chỉ quán <span className="text-bistro-sriracha">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingGps}
                    className="text-[11px] font-bold text-bistro-sriracha flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {isGettingGps ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang lấy GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 fill-bistro-sriracha" />
                        <span>Lấy GPS tại quán</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 84 Đặng Văn Ngữ, P.10, Quận Phú Nhuận"
                    className="w-full text-sm p-3 bg-white border-[1.5px] border-bistro-border rounded-xl focus:outline-hidden focus:border-bistro-ink transition-colors placeholder:text-stone-400 font-sans shadow-inner pr-8"
                  />
                  <MapPin className="w-4 h-4 text-bistro-muted absolute right-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Box 2: Nhóm món & Mức giá */}
            <div className="tactile-card bg-bistro-paper rounded-2xl p-4 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] space-y-3.5">
              {/* Nhóm món */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-2">
                  Nhóm món ăn
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINE_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCuisine(item)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-xl border-[1.5px] transition-all ${
                        cuisine === item
                          ? 'bg-bistro-sriracha text-white border-bistro-ink shadow-[2px_2px_0px_#1C1917]'
                          : 'bg-white text-bistro-ink border-bistro-border hover:bg-stone-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mức giá */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-2">
                  Mức giá ước tính
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {GOOGLE_PRICE_TIERS.map((tier) => (
                    <button
                      key={tier.tier}
                      type="button"
                      onClick={() => setPriceLevel(tier.tier)}
                      className={`p-2 rounded-xl border-[1.5px] text-left transition-all ${
                        priceLevel === tier.tier
                          ? 'bg-bistro-mustard/30 border-bistro-ink shadow-[2px_2px_0px_#1C1917]'
                          : 'bg-white border-bistro-border hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-emerald-800">
                          {tier.symbol}
                        </span>
                        {priceLevel === tier.tier && (
                          <Check className="w-3.5 h-3.5 text-bistro-ink stroke-[3]" />
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-bistro-ink mt-0.5 truncate">
                        {tier.rangeText}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 3: Tiện ích thực tế */}
            <div className="tactile-card bg-bistro-paper rounded-2xl p-4 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917]">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-2">
                Tiện ích thực tế của quán
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Máy lạnh */}
                <button
                  type="button"
                  onClick={() => setHasAc(!hasAc)}
                  className={`p-2.5 rounded-xl border-[1.5px] text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    hasAc
                      ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold shadow-xs'
                      : 'bg-white text-stone-600 border-bistro-border'
                  }`}
                >
                  <Wind className={`w-4 h-4 ${hasAc ? 'text-sky-600' : 'text-stone-400'}`} />
                  <span className="text-[11px]">Có máy lạnh</span>
                </button>

                {/* Đỗ ô tô */}
                <button
                  type="button"
                  onClick={() => setHasCarParking(!hasCarParking)}
                  className={`p-2.5 rounded-xl border-[1.5px] text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    hasCarParking
                      ? 'bg-purple-50 text-purple-900 border-purple-400 font-bold shadow-xs'
                      : 'bg-white text-stone-600 border-bistro-border'
                  }`}
                >
                  <Car className={`w-4 h-4 ${hasCarParking ? 'text-purple-600' : 'text-stone-400'}`} />
                  <span className="text-[11px]">Đỗ ô tô</span>
                </button>

                {/* Giữ xe free */}
                <button
                  type="button"
                  onClick={() => setFreeMotoParking(!freeMotoParking)}
                  className={`p-2.5 rounded-xl border-[1.5px] text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    freeMotoParking
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                      : 'bg-white text-stone-600 border-bistro-border'
                  }`}
                >
                  <Bike className={`w-4 h-4 ${freeMotoParking ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span className="text-[11px]">Giữ xe free</span>
                </button>
              </div>
            </div>

            {/* Box 4: Ảnh món ăn (Hỗ trợ Chụp ảnh trực tiếp & Chọn từ máy) */}
            <div className="tactile-card bg-bistro-paper rounded-2xl p-4 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink">
                    Ảnh món ăn / Quán
                  </label>
                  <span className="text-[10px] text-bistro-muted">
                    {userImagePreview ? 'Đã chọn ảnh thực tế' : 'Ảnh minh họa tự động'}
                  </span>
                </div>

                {/* Nút hành động chọn ảnh */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressingImage}
                    className="tactile-btn py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border-[1.5px] border-bistro-ink text-xs font-bold text-bistro-ink flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-bistro-sriracha" />
                    <span>Chụp ảnh ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressingImage}
                    className="tactile-btn py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border-[1.5px] border-bistro-ink text-xs font-bold text-bistro-ink flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-bistro-herb" />
                    <span>Chọn từ máy</span>
                  </button>
                </div>

                {/* Loading state khi nén ảnh */}
                {isCompressingImage && (
                  <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-center gap-2 text-xs font-mono text-bistro-muted mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-bistro-sriracha" />
                    <span>Đang nén & tối ưu hóa ảnh...</span>
                  </div>
                )}

                {/* Preview ảnh hiển thị */}
                {userImagePreview ? (
                  /* Preview ảnh người dùng đã chụp/tải lên */
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border-2 border-bistro-herb bg-stone-100">
                    <Image
                      src={userImagePreview}
                      alt="Ảnh quán người dùng tải lên"
                      fill
                      sizes="(max-width: 430px) 100vw, 400px"
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={handleClearUserImage}
                        className="w-7 h-7 rounded-full bg-bistro-ink/80 text-white flex items-center justify-center hover:bg-bistro-ink transition-colors"
                        title="Xóa ảnh này, dùng lại ảnh minh họa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-bistro-herb/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ảnh thực tế chụp từ máy ({userImageSizeKb} KB)</span>
                    </div>
                  </div>
                ) : showCustomImageInput ? (
                  /* Nhập URL ảnh thủ công */
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Dán URL ảnh món ăn (https://...)"
                      className="w-full text-xs p-2.5 bg-white border border-bistro-border rounded-xl focus:outline-hidden focus:border-bistro-ink font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomImageInput(false)}
                      className="text-[11px] text-bistro-muted hover:text-bistro-ink underline block"
                    >
                      Dùng ảnh tự động theo món
                    </button>
                  </div>
                ) : (
                  /* Ảnh minh họa tự động theo món */
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-bistro-ink/20 bg-stone-100">
                    <Image
                      src={getImageForSubCuisine(subCuisine)}
                      alt="Ảnh minh họa món"
                      fill
                      sizes="(max-width: 430px) 100vw, 400px"
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-stone-200 text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Ảnh minh họa theo món ({subCuisine})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomImageInput(true)}
                      className="absolute bottom-2 right-2 text-[10px] text-white/90 bg-black/50 hover:bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-xs underline"
                    >
                      Dán link ảnh
                    </button>
                  </div>
                )}
              </div>

              {/* Lý do đề xuất */}
              <div className="pt-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1">
                  Món ngon nhất / Lý do nên thử (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={shortReason}
                  onChange={(e) => setShortReason(e.target.value)}
                  placeholder="VD: Sườn cọng nướng mật ong mềm thơm, mỡ hành tóp mỡ giòn rụm..."
                  className="w-full text-xs p-3 bg-white border-[1.5px] border-bistro-border rounded-xl focus:outline-hidden focus:border-bistro-ink transition-colors placeholder:text-stone-400 font-sans shadow-inner resize-none"
                  maxLength={160}
                />
              </div>
            </div>

            {/* Nút gửi quán */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isCompressingImage}
                className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-[4px_4px_0px_#1C1917] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang lưu quán ruột...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5 fill-white text-bistro-sriracha" />
                    <span>Góp quán ruột ngay 🎉</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Modal xem trước quán đã có nếu bị trùng */}
      {selectedExistingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bistro-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-bistro-paper border-2 border-bistro-ink rounded-t-3xl sm:rounded-3xl shadow-[5px_5px_0px_#1C1917] p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-bistro-border">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                QUÁN ĐÃ CÓ TRÊN HỆ THỐNG
              </span>
              <button
                onClick={() => setSelectedExistingRestaurant(null)}
                className="w-7 h-7 rounded-lg bg-white border border-bistro-ink flex items-center justify-center hover:bg-stone-100"
              >
                <X className="w-4 h-4 text-bistro-ink" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-bistro-ink/20 mb-3 bg-stone-100">
              <Image
                src={selectedExistingRestaurant.image_url}
                alt={selectedExistingRestaurant.name}
                fill
                sizes="(max-width: 430px) 100vw, 400px"
                className="object-cover"
              />
            </div>

            <h3 className="font-display font-extrabold text-xl text-bistro-ink">
              {selectedExistingRestaurant.name}
            </h3>
            <p className="text-xs text-bistro-muted mt-0.5">
              {selectedExistingRestaurant.address}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-bistro-sriracha bg-bistro-sriracha/10 px-2 py-0.5 rounded border border-bistro-sriracha/30">
                {selectedExistingRestaurant.cuisine}
              </span>
              <span className="text-xs font-bold text-bistro-ink">
                {selectedExistingRestaurant.price_range_text}
              </span>
            </div>

            {selectedExistingRestaurant.description && (
              <p className="text-xs text-stone-600 bg-bistro-cream/80 p-2.5 rounded-xl border border-bistro-border mt-3 italic">
                &ldquo;{selectedExistingRestaurant.description}&rdquo;
              </p>
            )}

            <div className="mt-4 pt-2 flex gap-2">
              <button
                onClick={() => setSelectedExistingRestaurant(null)}
                className="flex-1 tactile-btn py-2.5 px-3 rounded-xl bg-white border border-bistro-ink text-xs font-bold text-bistro-ink"
              >
                Đóng lại
              </button>
              <Link
                href="/"
                className="flex-1 tactile-btn-lg py-2.5 px-3 rounded-xl bg-bistro-sriracha text-white text-xs font-bold text-center flex items-center justify-center gap-1 shadow-[2px_2px_0px_#1C1917]"
              >
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
