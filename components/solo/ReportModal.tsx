'use client'

import { useState } from 'react'
import { AlertTriangle, MapPin, Store, HelpCircle, Check, X, Loader2 } from 'lucide-react'
import { RestaurantWithDistance, RestaurantReportReason } from '@/types'
import { supabase } from '@/lib/supabase/client'

interface ReportModalProps {
  restaurant: RestaurantWithDistance | null
  isOpen: boolean
  onClose: () => void
  onReportSuccess?: (reason: RestaurantReportReason) => void
}

const REPORT_REASONS: Array<{
  id: RestaurantReportReason
  label: string
  desc: string
  icon: typeof AlertTriangle
}> = [
  {
    id: 'wrong_address',
    label: 'Sai địa chỉ / vị trí',
    desc: 'Số nhà không đúng, chỉ đường đến nhầm chỗ',
    icon: MapPin
  },
  {
    id: 'closed',
    label: 'Quán đã đóng cửa / dừng bán',
    desc: 'Mặt bằng đã trả hoặc quán không còn hoạt động',
    icon: Store
  },
  {
    id: 'wrong_info',
    label: 'Sai thông tin món / mức giá',
    desc: 'Tên món, nhóm ẩm thực hoặc giá chênh lệch nhiều',
    icon: HelpCircle
  }
]

export default function ReportModal({
  restaurant,
  isOpen,
  onClose,
  onReportSuccess
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<RestaurantReportReason>('wrong_address')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen || !restaurant) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Thử gọi Supabase RPC report_restaurant
      const isConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-supabase')
      )

      if (isConfigured) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('report_restaurant', {
          p_restaurant_id: restaurant.id,
          p_reason: selectedReason,
          p_details: details.trim() || null
        })
      }

      // 2. Lưu vào localStorage để hỗ trợ cả chế độ offline / local test
      try {
        const stored = localStorage.getItem('reported_restaurants')
        const reports = stored ? JSON.parse(stored) : []
        reports.push({
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          reason: selectedReason,
          details: details.trim(),
          timestamp: Date.now()
        })
        localStorage.setItem('reported_restaurants', JSON.stringify(reports))
      } catch (err) {
        console.warn('Lỗi ghi localStorage báo cáo:', err)
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setDetails('')
        onClose()
        onReportSuccess?.(selectedReason)
      }, 1500)
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo quán:', error)
      // Vẫn hiện thành công để không gián đoạn trải nghiệm người dùng
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
        onReportSuccess?.(selectedReason)
      }, 1500)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bistro-ink/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-bistro-cream border-[2px] border-bistro-ink rounded-t-3xl sm:rounded-3xl shadow-[5px_5px_0px_#1C1917] p-5 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-bistro-border mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bistro-sriracha/10 border border-bistro-sriracha/30 flex items-center justify-center text-bistro-sriracha">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-bistro-ink">
                Báo lỗi thông tin quán
              </h3>
              <p className="text-xs text-bistro-muted truncate max-w-[240px]">
                {restaurant.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bistro-paper border border-bistro-ink flex items-center justify-center hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-bistro-ink" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-bistro-herb/10 border-2 border-bistro-herb flex items-center justify-center text-bistro-herb">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h4 className="font-bold text-base text-bistro-ink mb-1">
              Đã ghi nhận báo lỗi!
            </h4>
            <p className="text-xs text-bistro-muted max-w-[260px] mx-auto">
              Cảm ơn bạn đã đóng góp để bản đồ ẩm thực Sài Gòn luôn chính xác.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lựa chọn lý do */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink">
                Vấn đề bạn gặp phải là gì?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const Icon = r.icon
                  const isSelected = selectedReason === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReason(r.id)}
                      className={`w-full text-left p-3 rounded-xl border-[1.5px] transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-bistro-mustard/20 border-bistro-ink shadow-[2px_2px_0px_#1C1917]'
                          : 'bg-white/80 border-bistro-border hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-bistro-ink bg-bistro-sriracha'
                            : 'border-bistro-muted bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-bistro-ink" />
                          <span className="font-bold text-xs text-bistro-ink">
                            {r.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-bistro-muted mt-0.5 leading-snug">
                          {r.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chi tiết bổ sung (tùy chọn) */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-bistro-ink mb-1">
                Ghi chú thêm (không bắt buộc)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="VD: Địa chỉ đúng là hẻm đối diện, quán vừa chuyển sang số 45..."
                rows={2}
                maxLength={200}
                className="w-full text-xs p-2.5 bg-white border border-bistro-border rounded-xl focus:outline-hidden focus:border-bistro-ink transition-colors resize-none placeholder:text-stone-400 font-sans"
              />
            </div>

            {/* Nút gửi */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 tactile-btn bg-bistro-paper hover:bg-stone-100 text-bistro-ink font-bold py-2.5 px-3 rounded-xl text-xs border border-bistro-ink"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 tactile-btn-lg bg-bistro-sriracha hover:bg-[#d63f1e] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-[2px_2px_0px_#1C1917] flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi báo lỗi</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
