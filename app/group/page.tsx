'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, KeyRound, Compass, MapPin, Sparkles, Navigation, ArrowRight } from 'lucide-react'
import { Coordinates } from '@/types'
import { DEFAULT_COORDINATES, VIBES } from '@/lib/constants/vibes'
import { getSavedUserLocation, saveUserLocation } from '@/lib/utils/storage'
import { getDistrictLabelFromCoords } from '@/lib/utils/maps'
import { createVotingRoom } from '@/lib/utils/roomService'

export default function GroupPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')

  // Form Tạo phòng (Host)
  const [hostName, setHostName] = useState('')
  const [radiusMeters, setRadiusMeters] = useState(5000)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form Vào phòng
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')

  // Vị trí Host
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_COORDINATES)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  // Khôi phục vị trí đã lưu và chạy GPS
  useEffect(() => {
    const saved = getSavedUserLocation()
    if (saved) {
      setUserLocation(saved)
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsDetectingGps(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const district = getDistrictLabelFromCoords(lat, lng)
          const coords: Coordinates = {
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            addressLabel: `${district} (GPS)`
          }
          setUserLocation(coords)
          saveUserLocation(coords)
          setIsDetectingGps(false)
        },
        () => setIsDetectingGps(false),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    }

    // Đọc tên đã dùng trước đó nếu có
    const savedName = localStorage.getItem('hom_nay_an_gi_voter_name')
    if (savedName) {
      setHostName(savedName)
      setJoinName(savedName)
    }
  }, [])

  // Xử lý tạo phòng
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostName.trim() || isCreating) return

    setIsCreating(true)
    try {
      localStorage.setItem('hom_nay_an_gi_voter_name', hostName.trim())

      const { room } = await createVotingRoom({
        hostName: hostName.trim(),
        radiusMeters,
        vibeSelected: selectedVibe,
        hostLat: userLocation.lat,
        hostLng: userLocation.lng
      })

      // Đánh dấu người này là Host của phòng
      localStorage.setItem(`room_host_${room.room_code}`, 'true')
      router.push(`/room/${room.room_code}`)
    } catch (err) {
      console.error('Lỗi khi tạo phòng:', err)
      alert('Không thể tạo phòng. Vui lòng thử lại!')
      setIsCreating(false)
    }
  }

  // Xử lý vào phòng bằng mã code
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = joinCode.trim().toUpperCase()
    if (!cleanCode) return

    if (joinName.trim()) {
      localStorage.setItem('hom_nay_an_gi_voter_name', joinName.trim())
    }

    router.push(`/room/${cleanCode}`)
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[430px] w-full mx-auto px-4 py-4 pb-20">
      <div className="space-y-4">
        {/* Header Title */}
        <div className="text-center pt-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-bistro-sriracha border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917] flex items-center justify-center text-white mb-2">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-bistro-ink leading-tight">
            Chốt kèo nhóm
          </h2>
          <p className="text-xs text-bistro-muted mt-0.5">
            Quẹt Tinder chọn quán • Chốt hóa đơn • Quay người bao
          </p>
        </div>

        {/* Tab Switcher: Tạo phòng vs Vào phòng */}
        <div className="flex p-1 bg-bistro-paper border-[1.5px] border-bistro-ink rounded-xl shadow-[2px_2px_0px_#1C1917]">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'create'
                ? 'bg-bistro-sriracha text-white shadow-xs'
                : 'text-bistro-muted hover:text-bistro-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo phòng mới</span>
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'join'
                ? 'bg-bistro-mustard text-bistro-ink shadow-xs'
                : 'text-bistro-muted hover:text-bistro-ink'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Nhập mã phòng</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: TẠO PHÒNG MỚI (HOST)                              */}
        {/* ======================================================== */}
        {tab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4 animate-in fade-in duration-200">
            {/* 1. Tên của bạn */}
            <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917]">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1.5">
                Tên hiển thị của bạn (Host):
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nam, Linh, Trưởng nhóm..."
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={20}
                className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl bg-bistro-cream border border-bistro-ink focus:outline-none focus:ring-2 focus:ring-bistro-sriracha"
              />
            </div>

            {/* 2. Vị trí trung tâm & Bán kính */}
            <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink">
                  VỊ TRÍ XUẤT PHÁT:
                </label>
                <span className="text-[11px] font-semibold text-bistro-sriracha truncate max-w-[170px]">
                  {isDetectingGps ? 'Đang dò GPS...' : userLocation.addressLabel || 'TP. Hồ Chí Minh'}
                </span>
              </div>

              {/* Bán kính chọn */}
              <div className="mt-3">
                <span className="text-[11px] text-bistro-muted block mb-2 font-mono">
                  Bán kính tìm quán quanh bạn:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 3000, 5000, 10000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusMeters(r)}
                      className={`py-2 px-1 text-center font-mono text-xs font-bold rounded-xl border transition-all ${
                        radiusMeters === r
                          ? 'bg-bistro-mustard border-bistro-ink shadow-[2px_2px_0px_#1C1917] text-bistro-ink'
                          : 'bg-bistro-cream border-bistro-border text-bistro-muted hover:text-bistro-ink'
                      }`}
                    >
                      {(r / 1000).toFixed(0)} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Chọn nhanh Vibe (Tùy chọn) */}
            <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917]">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-2">
                VIBE BỮA ĂN (TÙY CHỌN):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVibe(null)}
                  className={`p-2 rounded-xl border font-mono text-xs font-bold text-left transition-all ${
                    selectedVibe === null
                      ? 'bg-bistro-mustard border-bistro-ink shadow-xs text-bistro-ink'
                      : 'bg-bistro-cream border-bistro-border text-bistro-muted'
                  }`}
                >
                  🎲 Gì cũng được
                </button>
                {VIBES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSelectedVibe(v.key)}
                    className={`p-2 rounded-xl border font-mono text-xs font-bold text-left transition-all truncate ${
                      selectedVibe === v.key
                        ? 'bg-bistro-mustard border-bistro-ink shadow-xs text-bistro-ink'
                        : 'bg-bistro-cream border-bistro-border text-bistro-muted'
                    }`}
                  >
                    {v.emoji} {v.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !hostName.trim()}
              className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng chốt kèo ngay'}</span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: NHẬP MÃ PHÒNG (GUESTS)                            */}
        {/* ======================================================== */}
        {tab === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-5 shadow-[3px_3px_0px_#1C1917] space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1.5">
                  MÃ PHÒNG 6 KÝ TỰ:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: K3X9A2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full font-mono font-black text-center text-2xl tracking-widest px-3 py-3 rounded-xl bg-bistro-cream border-2 border-bistro-ink uppercase focus:outline-none focus:ring-2 focus:ring-bistro-mustard"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1.5">
                  TÊN HIỂN THỊ CỦA BẠN:
                </label>
                <input
                  type="text"
                  placeholder="VD: Duy, Mai, Tuấn..."
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={20}
                  className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl bg-bistro-cream border border-bistro-ink focus:outline-none focus:ring-2 focus:ring-bistro-mustard"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={joinCode.trim().length < 6}
              className="w-full tactile-btn-lg bg-bistro-mustard hover:bg-[#eab039] disabled:opacity-50 text-bistro-ink font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm border-[1.5px] border-bistro-ink shadow-[3px_3px_0px_#1C1917]"
            >
              <span>Vào phòng chốt kèo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
