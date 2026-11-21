'use client'

import { VIBES } from '@/lib/constants/vibes'
import { VibeKey, ParkingFilterOption } from '@/types'
import { Wind, Coins, Heart, Car, Bike, Dices, SlidersHorizontal, Check } from 'lucide-react'

interface VibeGridProps {
  selectedVibes: VibeKey[]
  onToggleVibe: (vibe: VibeKey) => void
  parkingFilter: ParkingFilterOption
  onChangeParkingFilter: (parking: ParkingFilterOption) => void
  onSelectRandom: () => void
  onOpenAdvancedFilter: () => void
  isAdvancedFilterActive: boolean
}

export default function VibeGrid({
  selectedVibes,
  onToggleVibe,
  parkingFilter,
  onChangeParkingFilter,
  onSelectRandom,
  onOpenAdvancedFilter,
  isAdvancedFilterActive
}: VibeGridProps) {
  const getIcon = (key: VibeKey) => {
    switch (key) {
      case 'mat_me':
        return <Wind className="w-3.5 h-3.5 text-sky-600" />
      case 'cuoi_thang':
        return <Coins className="w-3.5 h-3.5 text-emerald-600" />
      case 'hen_ho':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />
    }
  }

  // Toggle parking chips
  const toggleMoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (parkingFilter === 'both') {
      onChangeParkingFilter('car')
    } else if (parkingFilter === 'moto') {
      onChangeParkingFilter('none')
    } else if (parkingFilter === 'car') {
      onChangeParkingFilter('both')
    } else {
      onChangeParkingFilter('moto')
    }
  }

  const toggleCar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (parkingFilter === 'both') {
      onChangeParkingFilter('moto')
    } else if (parkingFilter === 'car') {
      onChangeParkingFilter('none')
    } else if (parkingFilter === 'moto') {
      onChangeParkingFilter('both')
    } else {
      onChangeParkingFilter('car')
    }
  }

  const isMotoActive = parkingFilter === 'moto' || parkingFilter === 'both'
  const isCarActive = parkingFilter === 'car' || parkingFilter === 'both'
  const isParkingActive = parkingFilter !== 'none'

  const activeFiltersCount = selectedVibes.length + (isParkingActive ? 1 : 0)

  return (
    <div className="px-4 py-2.5">
      {/* Header filter title & advance filter button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="font-display font-bold text-xs uppercase tracking-wider text-bistro-ink">
            Bộ lọc theo Vibe & Tiện ích
          </h2>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-bistro-sriracha text-white text-[10px] font-bold flex items-center justify-center font-mono">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={onOpenAdvancedFilter}
          className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-all ${
            isAdvancedFilterActive
              ? 'bg-bistro-mustard border-bistro-ink text-bistro-ink shadow-[1px_1px_0px_#1C1917]'
              : 'bg-bistro-paper border-bistro-border text-bistro-muted hover:text-bistro-ink hover:border-bistro-ink'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Bộ lọc {isAdvancedFilterActive && '• Đang lọc'}</span>
        </button>
      </div>

      {/* Grid: 3 Vibe Cards + 1 Chỗ Đỗ Xe Card + 1 Random Card (Full Width) */}
      <div className="grid grid-cols-2 gap-2">
        {/* 3 Vibe Cards (Multi-Select) */}
        {VIBES.map((vibe) => {
          const isSelected = selectedVibes.includes(vibe.key)

          return (
            <button
              key={vibe.key}
              onClick={() => onToggleVibe(vibe.key)}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-bistro-paper border-[1.8px] border-bistro-ink shadow-[2.5px_2.5px_0px_#1C1917] ring-1 ring-bistro-ink'
                  : 'bg-bistro-paper/80 border-bistro-border hover:border-bistro-ink shadow-[1px_1px_0px_#E6DFD3] active:translate-x-[1px] active:translate-y-[1px]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{vibe.emoji}</span>
                <div className="w-5 h-5 rounded-md bg-stone-100 border border-bistro-border/60 flex items-center justify-center">
                  {getIcon(vibe.key)}
                </div>
              </div>

              <div>
                <div className="font-display font-bold text-xs text-bistro-ink leading-tight">
                  {vibe.title}
                </div>
                <div className="text-[10px] text-bistro-muted mt-0.5 line-clamp-1">
                  {vibe.shortLabel}
                </div>
              </div>

              {/* Multi-select checkmark */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-bistro-sriracha text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}

        {/* Card 5: CHỖ ĐỖ XE (Tách riêng, cho phép chọn xe máy, ô tô hoặc cả hai) */}
        <div
          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
            isParkingActive
              ? 'bg-bistro-paper border-[1.8px] border-bistro-ink shadow-[2.5px_2.5px_0px_#1C1917]'
              : 'bg-bistro-paper/80 border-bistro-border shadow-[1px_1px_0px_#E6DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg">🅿️</span>
            <span className="text-[10px] font-bold text-bistro-muted uppercase tracking-wider">
              Bãi đỗ
            </span>
          </div>

          <div>
            <div className="font-display font-bold text-xs text-bistro-ink leading-tight mb-1.5">
              Chỗ đỗ xe
            </div>
            {/* 2 Chips toggle riêng: Xe máy & Ô tô */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMoto}
                className={`py-1 px-1.5 rounded-md border text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isMotoActive
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:border-bistro-ink'
                }`}
              >
                <Bike className="w-3 h-3" />
                <span>Xe máy</span>
              </button>
              <button
                type="button"
                onClick={toggleCar}
                className={`py-1 px-1.5 rounded-md border text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isCarActive
                    ? 'bg-purple-100 border-purple-600 text-purple-900 shadow-xs'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:border-bistro-ink'
                }`}
              >
                <Car className="w-3 h-3" />
                <span>Ô tô</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: GÌ CŨNG ĐƯỢC! (Random - Spans 2 columns) */}
        <button
          onClick={onSelectRandom}
          className="col-span-2 p-2.5 rounded-xl border text-left transition-all relative flex items-center justify-between bg-gradient-to-r from-bistro-mustard/25 via-bistro-mustard/15 to-bistro-sriracha/15 border-bistro-ink shadow-[2px_2px_0px_#1C1917] active:translate-x-[1px] active:translate-y-[1px] hover:border-bistro-ink"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎲</span>
            <div>
              <div className="font-display font-bold text-xs text-bistro-ink leading-tight flex items-center gap-1.5">
                <span>Gì cũng được!</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bistro-sriracha/10 text-bistro-sriracha font-bold">
                  Khám phá
                </span>
              </div>
              <div className="text-[10px] text-bistro-muted mt-0.5">
                Bỏ chọn hết • Random chuẩn gu quanh bạn
              </div>
            </div>
          </div>

          <div className="w-6 h-6 rounded-md bg-bistro-paper border border-bistro-ink/50 flex items-center justify-center shrink-0">
            <Dices className="w-3.5 h-3.5 text-bistro-sriracha" />
          </div>
        </button>
      </div>
    </div>
  )
}
