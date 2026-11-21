'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import { MapPin, Navigation, Copy, Check, Star, Share2, RefreshCw, Trophy, Utensils, Award } from 'lucide-react'
import { VotingRoom, RestaurantWithDistance } from '@/types'
import { getGoogleMapsDirectionsUrl, copyToClipboard } from '@/lib/utils/maps'
import { saveMealToHistory } from '@/lib/utils/storage'
import PayerRoulette from './PayerRoulette'

interface RoomReceiptProps {
  room: VotingRoom
  winner: RestaurantWithDistance
  rankedList: Array<{
    restaurant: RestaurantWithDistance
    likesCount: number
    dislikesCount: number
    totalVotes: number
    matchRate: number
  }>
  participants: string[]
  userLocation?: { lat: number; lng: number } | null
  onReset?: () => void
}

export default function RoomReceipt({
  room,
  winner,
  rankedList,
  participants,
  userLocation,
  onReset
}: RoomReceiptProps) {
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedName, setCopiedName] = useState(false)
  const [payer, setPayer] = useState<string | null>(null)

  useEffect(() => {
    if (winner) {
      saveMealToHistory(winner.id, winner.name, winner.cuisine, {
        address: winner.address,
        image_url: winner.image_url,
        price_range_text: winner.price_range_text,
        rating: winner.rating
      })
    }
  }, [winner])

  // URL chỉ đường Google Maps chính xác (xuất phát từ tọa độ GPS thực tế của người dùng)
  const directionsUrl = getGoogleMapsDirectionsUrl(
    winner.lat,
    winner.lng,
    winner.name,
    winner.address,
    userLocation?.lat,
    userLocation?.lng
  )

  const handleOpenGoogleMaps = () => {
    window.open(directionsUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyName = async () => {
    const success = await copyToClipboard(winner.name)
    if (success) {
      setCopiedName(true)
      setTimeout(() => setCopiedName(false), 2500)
    }
  }

  // Tạo tin nhắn tóm tắt kèo hài hước để dán vào Zalo / Messenger
  const handleCopySummary = async () => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const summaryText = `🎉 KÈO ĂN ĐÃ ĐƯỢC CHỐT! (#${room.room_code})
━━━━━━━━━━━━━━━━━━━
🍜 Quán chốt: ${winner.name}
📍 Địa chỉ: ${winner.address}
💰 Mức giá: ${winner.price_range_text}
👥 Người tham gia: ${participants.join(', ') || 'Cả nhóm'}
🏆 Nhà tài trợ / Người bao: ${payer || 'Chưa quay chọn'}
━━━━━━━━━━━━━━━━━━━
🗺️ Chỉ đường Google Maps: ${directionsUrl}
(Chốt bằng webapp "Hôm nay ăn gì?")`

    const success = await copyToClipboard(summaryText)
    if (success) {
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2500)
    }
  }

  const winnerStat = rankedList.find((item) => item.restaurant.id === winner.id)

  return (
    <div className="w-full max-w-[430px] mx-auto pb-24 px-4 pt-2 animate-in fade-in duration-300">
      {/* Container phong cách Hóa Đơn Máy In Nhiệt (Thermal POS Receipt Paper) */}
      <div className="relative bg-white border-x-2 border-b-2 border-bistro-ink shadow-[5px_5px_0px_#1C1917] rounded-b-2xl overflow-hidden font-mono text-bistro-ink">
        {/* Răng cưa mép giấy xé ở trên cùng */}
        <div
          className="h-4 w-full bg-white border-t-2 border-bistro-ink"
          style={{
            backgroundImage: `radial-gradient(circle at 10px 0, transparent 0, transparent 6px, #1C1917 7px, white 8px)`,
            backgroundSize: '20px 20px',
            backgroundRepeat: 'repeat-x'
          }}
        />

        <div className="p-5 pt-3">
          {/* Header Hóa Đơn */}
          <div className="text-center pb-4 border-b-2 border-dashed border-bistro-ink/30">
            <span className="text-2xl block mb-1">🧾</span>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-wider text-bistro-ink">
              TIỆM CHỐT KÈO SÀI GÒN
            </h2>
            <p className="text-[11px] text-bistro-muted uppercase tracking-widest mt-0.5">
              HÓA ĐƠN ĂN UỐNG ĐỒNG THUẬN
            </p>
            <div className="flex items-center justify-between text-[11px] text-bistro-muted mt-3 pt-2 border-t border-dotted border-bistro-border">
              <span>MÃ PHÒNG: #{room.room_code}</span>
              <span>HOST: {room.host_name}</span>
            </div>
            <div className="text-[10px] text-bistro-muted text-left mt-0.5">
              THỜI GIAN: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Quán Ăn Chiến Thắng */}
          <div className="my-4 pb-4 border-b-2 border-dashed border-bistro-ink/30">
            <div className="flex items-center gap-1.5 text-bistro-sriracha font-bold text-xs uppercase mb-2">
              <Trophy className="w-4 h-4 fill-bistro-sriracha" />
              <span>QUÁN CHIẾN THẮNG (TOP 1 MATCH)</span>
            </div>

            {/* Ảnh món ăn */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-bistro-ink/20 mb-3 bg-stone-100">
              <Image
                src={winner.image_url}
                alt={winner.name}
                fill
                sizes="(max-width: 430px) 100vw, 400px"
                className="object-cover"
              />
              <div className="absolute top-2 left-2 bg-bistro-mustard border border-bistro-ink font-mono text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                {winnerStat ? `${winnerStat.likesCount}/${Math.max(1, participants.length)} người duyệt (${winnerStat.matchRate}%)` : 'Chiến thắng'}
              </div>
            </div>

            {/* Thông tin quán */}
            <h3 className="font-display font-black text-2xl text-bistro-ink leading-snug">
              {winner.name}
            </h3>

            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="font-bold text-bistro-sriracha bg-bistro-sriracha/10 px-2 py-0.5 rounded border border-bistro-sriracha/30">
                {winner.cuisine}
              </span>
              <span className="font-bold text-bistro-ink">{winner.price_range_text}</span>
              <div className="flex items-center gap-1 text-bistro-ink">
                <Star className="w-3.5 h-3.5 fill-bistro-mustard text-bistro-ink stroke-[1.5]" />
                <span className="font-bold">{winner.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-2.5 p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-bistro-sriracha shrink-0 mt-0.5" />
              <span className="text-stone-700 leading-snug font-sans">{winner.address}</span>
            </div>
          </div>

          {/* Vòng quay Roulette: Ai là người bao kèo? */}
          <PayerRoulette
            participants={participants}
            selectedPayer={payer}
            onSelectPayer={(name) => setPayer(name)}
          />

          {/* Danh sách các quán về nhì (Runners-up) */}
          {rankedList.length > 1 && (
            <div className="my-4 pt-2 pb-3 border-t-2 border-dashed border-bistro-ink/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-bistro-muted block mb-2">
                CÁC ỨNG VIÊN VỀ NHÌ:
              </span>
              <div className="space-y-1.5">
                {rankedList.slice(1, 4).map((item, idx) => (
                  <div
                    key={item.restaurant.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-dotted border-stone-200"
                  >
                    <span className="truncate max-w-[220px]">
                      #{idx + 2}. {item.restaurant.name}
                    </span>
                    <span className="font-bold shrink-0 text-bistro-muted">
                      {item.likesCount} 👍 ({item.matchRate}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer hóa đơn: Nạn nhân tham gia */}
          <div className="pt-2 text-center text-[11px] text-bistro-muted border-t-2 border-dashed border-bistro-ink/30">
            <p className="uppercase tracking-wider">
              NẠN NHÂN THAM GIA: {participants.join(', ') || 'Cả nhóm'}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              *** CHÚC MỌI NGƯỜI CÓ MỘT BỮA ĂN VUI VẺ! ***
            </p>
          </div>
        </div>

        {/* Răng cưa mép giấy xé ở đáy hóa đơn */}
        <div
          className="h-4 w-full bg-white border-b-2 border-bistro-ink"
          style={{
            backgroundImage: `radial-gradient(circle at 10px 10px, transparent 0, transparent 6px, #1C1917 7px, white 8px)`,
            backgroundSize: '20px 20px',
            backgroundRepeat: 'repeat-x'
          }}
        />
      </div>

      {/* Action Buttons phía dưới */}
      <div className="mt-4 space-y-2.5">
        {/* Nút 1: Chỉ đường Google Maps */}
        <button
          onClick={handleOpenGoogleMaps}
          className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
        >
          <Navigation className="w-4 h-4 fill-white" />
          <span>Chỉ đường trên Google Maps</span>
        </button>

        {/* Nút 2: Copy tóm tắt kèo gửi Zalo / Messenger */}
        <button
          onClick={handleCopySummary}
          className="w-full tactile-btn bg-bistro-paper hover:bg-stone-50 text-bistro-ink font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917]"
        >
          {copiedSummary ? (
            <>
              <Check className="w-4 h-4 text-bistro-herb stroke-[3]" />
              <span className="text-bistro-herb">Đã copy tóm tắt kèo! Dán vào Zalo ngay</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-bistro-ink" />
              <span>Copy tóm tắt kèo (Gửi Zalo / Messenger)</span>
            </>
          )}
        </button>

        {/* Nút 3: Hàng phụ (Copy tên quán & Kèo mới) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
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

          {onReset && (
            <button
              onClick={onReset}
              className="tactile-btn bg-bistro-mustard hover:bg-[#eab039] text-bistro-ink font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-bistro-ink" />
              <span className="text-[11px] truncate">Tạo kèo mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
