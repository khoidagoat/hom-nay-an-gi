'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Sparkles, ChevronDown } from 'lucide-react'
import { Coordinates } from '@/types'
import LocationModal from './LocationModal'
import AppLogo from '@/components/AppLogo'

interface HeaderProps {
  currentLocation?: Coordinates | null
  onSelectLocation?: (coords: Coordinates) => void
  onDetectGps?: () => Promise<void> | void
  isDetectingGps?: boolean
  showLocationPill?: boolean
}

export default function Header({
  currentLocation,
  onSelectLocation,
  onDetectGps,
  isDetectingGps = false,
  showLocationPill = true
}: HeaderProps) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const canShowLocation =
    showLocationPill &&
    Boolean(currentLocation) &&
    Boolean(onSelectLocation) &&
    Boolean(onDetectGps)

  return (
    <>
      <header className="px-4 pt-4 pb-3 border-b border-bistro-border bg-bistro-cream sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <AppLogo size={42} className="shrink-0" />
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-bistro-ink leading-tight flex items-center gap-1.5">
                Hôm nay ăn gì?
                <Sparkles className="w-4 h-4 text-bistro-mustard fill-bistro-mustard" />
              </h1>
              <p className="text-[11px] font-medium text-bistro-muted">
                0s đắn đo • Chốt ngay quán ngon
              </p>
            </div>
          </Link>

          {/* Location Pill (Chỉ hiện khi có đủ dữ liệu vị trí) */}
          {canShowLocation && (
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="tactile-btn bg-bistro-paper px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 max-w-[170px] text-left hover:bg-stone-50"
              title="Đổi vị trí GPS hoặc khu vực"
            >
              <MapPin className={`w-3.5 h-3.5 text-bistro-sriracha shrink-0 ${isDetectingGps ? 'animate-bounce text-bistro-mustard' : ''}`} />
              <span className="text-[11px] font-semibold text-bistro-ink truncate">
                {isDetectingGps ? 'Đang dò GPS...' : (currentLocation?.addressLabel || 'Vị trí hiện tại')}
              </span>
              <ChevronDown className="w-3 h-3 text-bistro-muted shrink-0" />
            </button>
          )}
        </div>
      </header>

      {canShowLocation && currentLocation && onSelectLocation && onDetectGps && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          currentLocation={currentLocation}
          onSelectLocation={onSelectLocation}
          onDetectGps={onDetectGps}
          isDetectingGps={isDetectingGps}
        />
      )}
    </>
  )
}
