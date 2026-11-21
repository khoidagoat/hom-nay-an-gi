'use client'

import { useState } from 'react'
import { Copy, Check, Users, Play, Sparkles, MapPin, Share2, Compass } from 'lucide-react'
import { VotingRoom, RoomParticipant } from '@/types'
import { copyToClipboard } from '@/lib/utils/maps'

interface RoomLobbyProps {
  room: VotingRoom
  currentVoterName: string
  participants: RoomParticipant[]
  isHost: boolean
  onStartVoting: () => Promise<void>
  onJoinName: (name: string) => void
}

export default function RoomLobby({
  room,
  currentVoterName,
  participants,
  isHost,
  onStartVoting,
  onJoinName
}: RoomLobbyProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [inputName, setInputName] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  // Link chia sẻ phòng
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${room.room_code}`
      : `/room/${room.room_code}`

  const handleCopyLink = async () => {
    const inviteMessage = `🍜 Vào phòng chốt kèo ăn trưa/tối lẹ anh em ơi!
Mã phòng: ${room.room_code}
👉 Bấm vào link quẹt quán ngay: ${shareUrl}`

    const success = await copyToClipboard(inviteMessage)
    if (success) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputName.trim()) return
    onJoinName(inputName.trim())
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onStartVoting()
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="w-full max-w-[430px] mx-auto px-4 py-3 flex-1 flex flex-col justify-between animate-in fade-in duration-300">
      <div className="space-y-4">
        {/* Header Phòng & Mã Code */}
        <div className="text-center pt-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-bistro-sriracha bg-bistro-sriracha/10 px-3 py-1 rounded-full border border-bistro-sriracha/30 inline-block mb-2">
            PHÒNG CHỐT KÈO NHÓM
          </span>

          <div className="bg-bistro-paper border-2 border-bistro-ink rounded-2xl p-4 shadow-[4px_4px_0px_#1C1917] max-w-[300px] mx-auto text-center">
            <p className="text-[11px] font-mono text-bistro-muted uppercase">MÃ PHÒNG</p>
            <p className="font-mono font-black text-4xl text-bistro-ink tracking-widest my-1 select-all">
              {room.room_code}
            </p>
            <p className="text-[10px] text-bistro-muted">Host: {room.host_name}</p>
          </div>
        </div>

        {/* Nút Copy Link mời bạn bè */}
        <button
          onClick={handleCopyLink}
          className="w-full tactile-btn bg-bistro-mustard hover:bg-[#eab039] text-bistro-ink font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs border-[1.5px] border-bistro-ink shadow-[3px_3px_0px_#1C1917]"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-bistro-herb stroke-[3]" />
              <span className="text-bistro-ink font-bold">Đã copy link mời! Dán vào Zalo/Messenger ngay</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-bistro-ink" />
              <span>Copy link mời bạn bè vào phòng</span>
            </>
          )}
        </button>

        {/* Form nhập tên nếu là khách mới mở link */}
        {!currentVoterName && (
          <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917]">
            <h4 className="font-display font-bold text-sm text-bistro-ink mb-1.5">
              Nhập tên của bạn để vào quẹt quán:
            </h4>
            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Nam, Linh, Duy..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={20}
                className="flex-1 font-mono text-sm px-3 py-2 rounded-xl bg-bistro-cream border border-bistro-ink focus:outline-none focus:ring-2 focus:ring-bistro-sriracha"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputName.trim()}
                className="tactile-btn bg-bistro-sriracha disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Vào phòng
              </button>
            </form>
          </div>
        )}

        {/* Danh sách thành viên đang có mặt */}
        <div className="bg-bistro-paper border-[1.5px] border-bistro-ink rounded-2xl p-4 shadow-[3px_3px_0px_#1C1917]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-bistro-border">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-bistro-sriracha" />
              <h4 className="font-mono text-xs font-bold text-bistro-ink uppercase">
                THÀNH VIÊN TRONG PHÒNG ({participants.length})
              </h4>
            </div>
            <span className="text-[10px] text-bistro-herb font-bold font-mono animate-pulse">
              ● Đang chờ sẵn
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p.name}
                className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 ${
                  p.isHost
                    ? 'bg-bistro-sriracha/10 border-bistro-sriracha/40 text-bistro-sriracha'
                    : 'bg-bistro-cream border-bistro-border text-bistro-ink'
                }`}
              >
                <span>{p.isHost ? '👑' : '👤'}</span>
                <span>{p.name}</span>
                {p.name === currentVoterName && <span className="text-[10px] text-bistro-muted">(Bạn)</span>}
              </div>
            ))}
          </div>

          {participants.length === 1 && (
            <p className="text-[11px] text-bistro-muted mt-3 italic text-center">
              Chưa có bạn bè nào vào phòng. Hãy copy link ở trên gửi vào nhóm nhé!
            </p>
          )}
        </div>

        {/* Thông tin phạm vi & số quán */}
        <div className="p-3 rounded-xl bg-bistro-paper/60 border border-bistro-border text-xs text-bistro-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-bistro-muted" />
            <span>Bán kính: {(room.radius_meters / 1000).toFixed(0)}km quanh Host</span>
          </div>
          <span className="font-mono font-bold text-bistro-ink">
            {room.restaurant_ids.length} quán
          </span>
        </div>
      </div>

      {/* Action Footer: Bắt đầu quẹt */}
      <div className="pt-4 pb-2">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={isStarting || !currentVoterName}
            className="w-full tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0px_#1C1917]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isStarting
                ? 'Đang khởi động...'
                : `Bắt đầu quẹt quán! (${participants.length} người sẵn sàng)`}
            </span>
          </button>
        ) : (
          <div className="p-3.5 bg-bistro-cream border-[1.5px] border-bistro-ink rounded-xl text-center shadow-[2px_2px_0px_#1C1917]">
            <p className="font-mono text-xs font-bold text-bistro-ink flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bistro-mustard animate-ping inline-block" />
              <span>Đang đợi Host {room.host_name} bấm bắt đầu...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
