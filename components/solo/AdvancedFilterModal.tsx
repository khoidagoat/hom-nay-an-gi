'use client'

import { useState } from 'react'
import { X, SlidersHorizontal, RotateCcw, Check, Bike, Car } from 'lucide-react'
import { CUISINES, RADIUS_OPTIONS, GOOGLE_PRICE_TIERS } from '@/lib/constants/cuisines'
import { ActiveFiltersState, ParkingFilterOption, GooglePriceTier } from '@/types'

interface AdvancedFilterModalProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: ActiveFiltersState
  onApplyFilters: (filters: ActiveFiltersState) => void
  onResetFilters: () => void
}

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  onResetFilters
}: AdvancedFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<ActiveFiltersState>(currentFilters)

  if (!isOpen) return null

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  const handleReset = () => {
    onResetFilters()
    onClose()
  }

  const toggleMoto = () => {
    const cur = localFilters.parking
    let next: ParkingFilterOption = 'none'
    if (cur === 'both') next = 'car'
    else if (cur === 'moto') next = 'none'
    else if (cur === 'car') next = 'both'
    else next = 'moto'
    setLocalFilters({ ...localFilters, parking: next })
  }

  const toggleCar = () => {
    const cur = localFilters.parking
    let next: ParkingFilterOption = 'none'
    if (cur === 'both') next = 'moto'
    else if (cur === 'car') next = 'none'
    else if (cur === 'moto') next = 'both'
    else next = 'car'
    setLocalFilters({ ...localFilters, parking: next })
  }

  const togglePriceTier = (tier: GooglePriceTier) => {
    const exists = localFilters.priceTiers.includes(tier)
    const nextTiers = exists
      ? localFilters.priceTiers.filter((t) => t !== tier)
      : [...localFilters.priceTiers, tier]
    setLocalFilters({ ...localFilters, priceTiers: nextTiers })
  }

  const isMotoActive = localFilters.parking === 'moto' || localFilters.parking === 'both'
  const isCarActive = localFilters.parking === 'car' || localFilters.parking === 'both'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bistro-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto no-scrollbar bg-bistro-cream border-[1.5px] border-bistro-ink rounded-t-2xl sm:rounded-2xl shadow-[4px_4px_0px_#1C1917] p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-bistro-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bistro-mustard border border-bistro-ink flex items-center justify-center shadow-[1px_1px_0px_#1C1917]">
              <SlidersHorizontal className="w-4 h-4 text-bistro-ink" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-bistro-ink">Bộ lọc nâng cao</h3>
              <p className="text-xs text-bistro-muted">Tùy chỉnh khoảng cách, giá và tiện ích</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bistro-paper border border-bistro-ink flex items-center justify-center hover:bg-stone-100"
          >
            <X className="w-4 h-4 text-bistro-ink" />
          </button>
        </div>

        {/* 1. Bán kính tìm kiếm */}
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-bistro-muted mb-2 block">
            Bán kính tìm kiếm (Lệch tối đa ~200m): <span className="text-bistro-sriracha font-mono font-bold">{(localFilters.radiusMeters / 1000).toFixed(0)} km</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {RADIUS_OPTIONS.map((opt) => {
              const isSelected = localFilters.radiusMeters === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setLocalFilters({ ...localFilters, radiusMeters: opt.value })}
                  className={`py-2 px-2 text-xs rounded-xl border font-semibold transition-all ${
                    isSelected
                      ? 'bg-bistro-paper border-bistro-ink shadow-[2px_2px_0px_#1C1917] text-bistro-sriracha font-bold'
                      : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted hover:border-bistro-ink'
                  }`}
                >
                  {opt.label.split(' ')[0]} {opt.label.split(' ')[1]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Mức giá theo chuẩn Google (1-100k, 100-200k, 200-600k, >600k) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-bistro-muted">
              Mức giá theo Google:
            </label>
            {localFilters.priceTiers.length > 0 && (
              <button
                onClick={() => setLocalFilters({ ...localFilters, priceTiers: [] })}
                className="text-[10px] text-bistro-sriracha font-semibold hover:underline"
              >
                Xóa chọn
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GOOGLE_PRICE_TIERS.map((tier) => {
              const isSelected = localFilters.priceTiers.includes(tier.tier)
              return (
                <button
                  key={tier.tier}
                  onClick={() => togglePriceTier(tier.tier)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-bistro-paper border-bistro-ink shadow-[2px_2px_0px_#1C1917]'
                      : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted hover:border-bistro-ink'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-extrabold text-xs text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      {tier.symbol}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-bistro-sriracha stroke-[3]" />}
                  </div>
                  <div className="font-display font-bold text-xs text-bistro-ink">
                    {tier.label}
                  </div>
                  <div className="text-[10px] text-bistro-muted mt-0.5 line-clamp-1">
                    {tier.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Chỗ đỗ xe (Parking Filter) */}
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-bistro-muted mb-2 block">
            Chỗ đỗ xe (Có thể chọn cả 2):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleMoto}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isMotoActive
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[2px_2px_0px_#1C1917]'
                  : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Giữ xe máy free</span>
              </div>
              {isMotoActive && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
            </button>
            <button
              onClick={toggleCar}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isCarActive
                  ? 'bg-purple-50 border-purple-600 text-purple-950 shadow-[2px_2px_0px_#1C1917]'
                  : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-purple-600" />
                <span>Đậu được ô tô</span>
              </div>
              {isCarActive && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* 4. Loại món ăn */}
        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-bistro-muted mb-2 block">
            Loại món ăn:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setLocalFilters({ ...localFilters, cuisine: null })}
              className={`py-2 px-3 text-xs rounded-xl border text-left font-semibold transition-all ${
                localFilters.cuisine === null
                  ? 'bg-bistro-paper border-bistro-ink shadow-[2px_2px_0px_#1C1917] text-bistro-sriracha'
                  : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted hover:border-bistro-ink'
              }`}
            >
              🍽️ Tất cả món
            </button>
            {CUISINES.map((item) => {
              const isSelected = localFilters.cuisine === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setLocalFilters({ ...localFilters, cuisine: item.key })}
                  className={`py-2 px-3 text-xs rounded-xl border text-left font-semibold transition-all ${
                    isSelected
                      ? 'bg-bistro-paper border-bistro-ink shadow-[2px_2px_0px_#1C1917] text-bistro-sriracha'
                      : 'bg-bistro-paper/60 border-bistro-border text-bistro-muted hover:border-bistro-ink'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-bistro-border">
          <button
            onClick={handleReset}
            className="tactile-btn py-3 px-4 bg-bistro-paper text-bistro-ink rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 tactile-btn py-3 px-4 bg-bistro-sriracha text-white rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1C1917]"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </div>
  )
}
