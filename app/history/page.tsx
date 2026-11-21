'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Trash2, 
  MapPin, 
  Navigation, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  UtensilsCrossed, 
  History as HistoryIcon,
  CheckCircle2
} from 'lucide-react'
import Header from '@/components/common/Header'
import { MealHistoryItem } from '@/types'
import { getMealHistory, deleteMealFromHistory, clearMealHistory } from '@/lib/utils/storage'
import { getGoogleMapsSearchUrl, copyToClipboard } from '@/lib/utils/maps'

export default function HistoryPage() {
  const [history, setHistory] = useState<MealHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    const data = getMealHistory()
    setHistory(data)
    setIsLoading(false)
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2200)
  }

  const handleDeleteItem = (id: string, name: string) => {
    const updated = deleteMealFromHistory(id)
    setHistory(updated)
    showToast(`Đã bỏ né quán "${name}". Lần sau có thể được gợi ý lại!`)
  }

  const handleClearAll = () => {
    clearMealHistory()
    setHistory([])
    setIsConfirmClearOpen(false)
    showToast('Đã xóa toàn bộ lịch sử 7 ngày!')
  }

  const handleCopyName = async (name: string, id: string) => {
    const success = await copyToClipboard(name)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleOpenMaps = (name: string, address?: string) => {
    const url = getGoogleMapsSearchUrl(name, address)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[430px] w-full mx-auto pb-24">
      {/* Top Header */}
      <Header showLocationPill={false} />

      <main className="px-4 py-3 flex-1">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[380px] bg-bistro-ink text-white text-xs px-3.5 py-2.5 rounded-xl shadow-lg border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-bistro-mustard shrink-0" />
            <span className="font-medium truncate">{toastMessage}</span>
          </div>
        )}

        {/* Page Title & Back Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="w-8 h-8 rounded-lg bg-bistro-paper border border-bistro-ink flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-bistro-ink" />
            </Link>
            <div>
              <h2 className="font-display font-extrabold text-xl text-bistro-ink flex items-center gap-1.5">
                Lịch sử ăn uống
                <HistoryIcon className="w-4 h-4 text-bistro-sriracha" />
              </h2>
              <p className="text-[11px] text-bistro-muted">
                Các quán đã chốt trong 7 ngày gần nhất
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-md border border-red-200 hover:border-red-400 bg-red-50/60 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa hết</span>
            </button>
          )}
        </div>

        {/* Informational Banner */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl mb-3.5 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
          <Sparkles className="w-4 h-4 text-bistro-sriracha shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold">Thuật toán né trùng tự động:</span> Các quán trong danh sách này đang được hệ thống loại trừ khỏi gợi ý ngẫu nhiên để bạn không bị ăn trùng bữa!
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bistro-paper/60 rounded-xl animate-pulse border border-bistro-border" />
            ))}
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-4 bg-bistro-paper/70 border border-bistro-border rounded-2xl shadow-xs">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-stone-100 border border-bistro-border flex items-center justify-center text-3xl">
              🥣
            </div>
            <h3 className="font-display font-bold text-lg text-bistro-ink mb-1">
              Chưa có quán nào trong 7 ngày qua!
            </h3>
            <p className="text-xs text-bistro-muted max-w-[280px] mx-auto mb-5 leading-relaxed">
              Khi bạn bấm &quot;Chốt quán này!&quot; hoặc chốt kèo nhóm xong, quán sẽ xuất hiện ở đây để tự động né trùng bữa.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-bistro-sriracha text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#1C1917] active:translate-x-[1px] active:translate-y-[1px] hover:bg-[#d63f1e] transition-all"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Khám phá quán ngon ngay</span>
            </Link>
          </div>
        ) : (
          /* List of History Items */
          <div className="space-y-2.5">
            {history.map((item) => {
              const isCopied = copiedId === item.restaurantId
              const itemDate = new Date(item.timestamp)
              const timeFormatted = itemDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={`${item.restaurantId}-${item.timestamp}`}
                  className="p-3 bg-bistro-paper border border-bistro-ink/80 rounded-xl shadow-[2px_2px_0px_#1C1917] hover:border-bistro-ink transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Thumbnail Image */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-bistro-border shrink-0 bg-stone-100">
                      <Image
                        src={item.image_url || '/images/food/default.webp'}
                        alt={item.restaurantName}
                        fill
                        sizes="56px"
                        unoptimized
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/food/default.webp'
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-display font-bold text-sm text-bistro-ink truncate">
                          {item.restaurantName}
                        </span>
                        <span className="font-mono text-[10px] text-bistro-muted shrink-0">
                          {item.dateString} • {timeFormatted}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-semibold text-stone-700">
                          {item.cuisine}
                        </span>
                        {item.price_range_text && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 font-bold">
                            {item.price_range_text}
                          </span>
                        )}
                      </div>

                      {item.address && (
                        <p className="text-[11px] text-bistro-muted truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-bistro-sriracha shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-bistro-border/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenMaps(item.restaurantName, item.address)}
                        className="py-1 px-2 rounded-md bg-stone-100 hover:bg-stone-200 text-bistro-ink text-[11px] font-semibold flex items-center gap-1 transition-all"
                        title="Mở Google Maps chỉ đường"
                      >
                        <Navigation className="w-3 h-3 text-bistro-sriracha" />
                        <span>Chỉ đường</span>
                      </button>

                      <button
                        onClick={() => handleCopyName(item.restaurantName, item.restaurantId)}
                        className="py-1 px-2 rounded-md bg-stone-100 hover:bg-stone-200 text-bistro-ink text-[11px] font-semibold flex items-center gap-1 transition-all"
                        title="Sao chép tên quán"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-bistro-muted" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.restaurantId, item.restaurantName)}
                      className="py-1 px-2 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-600 text-[11px] flex items-center gap-1 transition-all"
                      title="Bỏ né quán này (cho phép gợi ý lại)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[10px]">Bỏ né</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Note */}
        <p className="text-[11px] text-center text-bistro-muted mt-6 px-2">
          💡 Dữ liệu lưu an toàn trên máy bạn. Sau 7 ngày, quán sẽ tự động rời danh sách né và quay trở lại vòng quay gợi ý.
        </p>
      </main>

      {/* Confirmation Modal for Clear All */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bistro-ink/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-bistro-cream border-[1.5px] border-bistro-ink rounded-2xl shadow-[4px_4px_0px_#1C1917] p-5">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center mb-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-bistro-ink mb-1">
              Xóa sạch lịch sử 7 ngày?
            </h3>
            <p className="text-xs text-bistro-muted mb-4 leading-relaxed">
              Sau khi xóa, tất cả các quán đã chốt sẽ có thể xuất hiện lại trong các lượt quay ngẫu nhiên kế tiếp.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-bistro-border bg-bistro-paper font-semibold text-xs text-bistro-ink hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-[2px_2px_0px_#1C1917]"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
