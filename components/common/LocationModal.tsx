'use client'

import { MapPin, Navigation, Check, X, Compass } from 'lucide-react'
import { FALLBACK_LOCATIONS } from '@/lib/constants/vibes'
import { Coordinates } from '@/types'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  currentLocation: Coordinates
  onSelectLocation: (coords: Coordinates) => void
  onDetectGps: () => Promise<void> | void
  isDetectingGps: boolean
}

export default function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onDetectGps,
  isDetectingGps
}: LocationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bistro-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[420px] max-h-[90vh] flex flex-col bg-bistro-cream border-[1.5px] border-bistro-ink rounded-t-2xl sm:rounded-2xl shadow-[4px_4px_0px_#1C1917] p-5 animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-bistro-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bistro-mustard border border-bistro-ink flex items-center justify-center shadow-[1px_1px_0px_#1C1917]">
              <Compass className="w-4 h-4 text-bistro-ink" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-bistro-ink">Chọn vị trí của bạn</h3>
              <p className="text-xs text-bistro-muted">Để tìm quán ăn quanh bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bistro-paper border border-bistro-ink flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4 text-bistro-ink" />
          </button>
        </div>

        {/* GPS Button */}
        <button
          onClick={async () => {
            await onDetectGps()
            onClose()
          }}
          disabled={isDetectingGps}
          className="w-full tactile-btn bg-bistro-paper hover:bg-stone-50 text-bistro-ink font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 mb-3 shrink-0 group border border-bistro-ink shadow-[2px_2px_0px_#1C1917]"
        >
          <Navigation className={`w-4 h-4 text-bistro-sriracha ${isDetectingGps ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
          <span>{isDetectingGps ? 'Đang định vị GPS...' : 'Lấy vị trí GPS hiện tại'}</span>
        </button>

        {/* Location Presets Header */}
        <div className="mb-2 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-bistro-muted block">
            Hoặc chọn nhanh theo quận:
          </span>
        </div>

        {/* Location Presets 2-Column Grid with Scroll */}
        <div className="overflow-y-auto max-h-[290px] pr-1 -mr-1">
          <div className="grid grid-cols-2 gap-2">
            {FALLBACK_LOCATIONS.map((loc) => {
              const isSelected =
                Math.abs(currentLocation.lat - loc.lat) < 0.005 &&
                Math.abs(currentLocation.lng - loc.lng) < 0.005

              return (
                <button
                  key={loc.name}
                  onClick={() => {
                    onSelectLocation({
                      lat: loc.lat,
                      lng: loc.lng,
                      addressLabel: `${loc.name}, TP.HCM`
                    })
                    onClose()
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-bistro-mustard/35 border-bistro-ink font-bold shadow-[2px_2px_0px_#1C1917]'
                      : 'bg-bistro-paper border-bistro-border hover:border-bistro-ink font-medium hover:bg-stone-50 shadow-[1px_1px_0px_#E6DFD3]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-bistro-sriracha' : 'text-bistro-muted'}`} />
                    <span className="text-xs text-bistro-ink font-semibold truncate">{loc.name}</span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 shrink-0 rounded-full bg-bistro-herb text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-[11px] text-center text-bistro-muted mt-3 shrink-0">
          💡 Vị trí chỉ lưu tạm thời trên trình duyệt, không gửi về bất kỳ server nào.
        </p>
      </div>
    </div>
  )
}
