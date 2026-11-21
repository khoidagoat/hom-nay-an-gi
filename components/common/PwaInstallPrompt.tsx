'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X, Sparkles } from 'lucide-react'
import AppLogo from '@/components/AppLogo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 0. Đăng ký Service Worker cho PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Registration failed:', err)
      })
    }

    // 1. Kiểm tra xem app đã được cài đặt và đang chạy ở chế độ Standalone hay chưa
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true

    if (isRunningStandalone) {
      setIsStandalone(true)
      return
    }

    // 2. Kiểm tra nếu người dùng đã bấm tắt thông báo trước đó trong vòng 7 ngày
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed')
    if (dismissedAt) {
      const elapsedDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (elapsedDays < 7) {
        return
      }
    }

    // 3. Nhận diện thiết bị iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    if (isIosDevice) {
      // Hiện thông báo hướng dẫn cho iOS sau 3 giây trải nghiệm
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    // 4. Bắt sự kiện beforeinstallprompt trên Android / Chromium
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      deferredPrompt = e
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    deferredPrompt = null
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-40 animate-in slide-in-from-bottom-3 fade-in duration-300">
      <div className="bg-bistro-paper border-2 border-bistro-ink rounded-2xl p-3.5 shadow-[4px_4px_0px_#1C1917] flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <AppLogo size={38} className="shrink-0" />
          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs text-bistro-ink flex items-center gap-1">
              <span>Cài app vào màn hình chính</span>
              <Sparkles className="w-3 h-3 text-bistro-sriracha fill-bistro-sriracha" />
            </h4>
            {isIos ? (
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Bấm nút <Share className="w-3 h-3 inline text-bistro-ink mx-0.5" /> sau đó chọn{' '}
                <span className="font-bold text-bistro-ink">
                  &ldquo;Thêm vào MH chính&rdquo; <PlusSquare className="w-3 h-3 inline text-bistro-ink mx-0.5" />
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Mở app nhanh tức thì, dùng mượt mà toàn màn hình không có viền trình duyệt.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIos && (
            <button
              onClick={handleInstallClick}
              className="tactile-btn py-1.5 px-3 rounded-lg bg-bistro-sriracha text-white text-[11px] font-bold shadow-xs hover:bg-[#d63f1e] flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Cài ngay</span>
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg text-bistro-muted hover:text-bistro-ink flex items-center justify-center"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
