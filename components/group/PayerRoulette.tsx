'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Dices, Sparkles, Trophy, UserCheck } from 'lucide-react'

interface PayerRouletteProps {
  participants: string[]
  onSelectPayer?: (name: string) => void
  selectedPayer?: string | null
}

export default function PayerRoulette({
  participants,
  onSelectPayer,
  selectedPayer
}: PayerRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [winner, setWinner] = useState<string | null>(selectedPayer || null)

  const names = participants.length > 0 ? participants : ['Bạn']

  const handleSpin = () => {
    if (isSpinning || names.length === 0) return

    setIsSpinning(true)
    setWinner(null)

    let current = 0
    let speed = 60 // Tốc độ ban đầu (ms)
    let iterations = 0
    const totalIterations = 25 + Math.floor(Math.random() * 15) // Xoay 25 - 40 vòng

    const interval = setInterval(() => {
      current = (current + 1) % names.length
      setHighlightedIndex(current)
      iterations++

      // Giảm tốc dần khi sắp về đích
      if (iterations > totalIterations - 10) {
        speed += 40
      }

      if (iterations >= totalIterations) {
        clearInterval(interval)
        setIsSpinning(false)
        const chosen = names[current]
        setWinner(chosen)
        onSelectPayer?.(chosen)

        // Pháo giấy ăn mừng người bao kèo
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E84A27', '#F4B942', '#2A7B56', '#1C1917']
        })
      }
    }, speed)
  }

  return (
    <div className="my-3 p-3.5 bg-bistro-cream/90 border-[1.5px] border-bistro-ink rounded-xl shadow-[3px_3px_0px_#1C1917]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-bistro-border">
        <div className="flex items-center gap-1.5">
          <Dices className="w-4 h-4 text-bistro-sriracha animate-pulse" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-bistro-ink">
            VÒNG QUAY NGƯỜI BAO KÈO
          </h4>
        </div>
        <span className="text-[10px] text-bistro-muted font-mono">
          {names.length} ứng viên
        </span>
      </div>

      {/* Danh sách người tham gia hiển thị dạng thẻ cuộn */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 my-2.5">
        {names.map((name, idx) => {
          const isHighlighted = idx === highlightedIndex
          const isFinalWinner = winner === name

          return (
            <div
              key={name + idx}
              className={`p-2 rounded-lg text-center font-mono text-xs font-bold transition-all duration-100 border ${
                isFinalWinner
                  ? 'bg-bistro-sriracha text-white border-bistro-ink shadow-[2px_2px_0px_#1C1917] scale-105'
                  : isHighlighted && isSpinning
                  ? 'bg-bistro-mustard text-bistro-ink border-bistro-ink scale-105'
                  : 'bg-bistro-paper text-bistro-ink border-bistro-border'
              }`}
            >
              <span className="truncate block">{name}</span>
            </div>
          )
        })}
      </div>

      {/* Thông báo kết quả người thắng cuộc */}
      {winner && !isSpinning && (
        <div className="mt-3 p-3 rounded-xl bg-bistro-mustard/30 border border-bistro-ink text-center animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-1 text-bistro-sriracha font-bold text-xs font-mono uppercase mb-0.5">
            <Trophy className="w-3.5 h-3.5 text-bistro-sriracha" />
            <span>NHÀ TÀI TRỢ CHÍNH HÔM NAY</span>
          </div>
          <p className="font-display font-extrabold text-xl text-bistro-ink">
            🎉 {winner} 🎉
          </p>
          <p className="text-[11px] text-bistro-muted mt-0.5">
            Cả nhóm xin chân thành cảm ơn tấm lòng vàng của bạn!
          </p>
        </div>
      )}

      {/* Nút bấm quay */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || names.length === 0}
        className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-[1.5px] border-bistro-ink transition-all ${
          isSpinning
            ? 'bg-stone-200 text-bistro-muted cursor-not-allowed'
            : 'tactile-btn bg-bistro-mustard hover:bg-[#eab039] text-bistro-ink shadow-[2px_2px_0px_#1C1917]'
        }`}
      >
        <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
        <span>{isSpinning ? 'Đang quay chọn...' : winner ? '🎲 Quay lại người khác' : '🎲 Quay tìm người trả tiền'}</span>
      </button>
    </div>
  )
}
