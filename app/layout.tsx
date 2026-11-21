import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/common/BottomNav'
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hom-nay-an-gi.vercel.app'),
  title: 'Hôm nay ăn gì? • 0s đắn đo, chốt ngay quán ngon',
  description: 'Trợ lý ẩm thực giải quyết nỗi đau đói nhưng lười suy nghĩ tại TP.HCM. Gợi ý 1 quán ngon chuẩn gu hoặc tạo phòng quẹt quán nhóm cùng bạn bè.',
  applicationName: 'Hôm nay ăn gì?',
  keywords: ['hôm nay ăn gì', 'quán ngon sài gòn', 'ăn gì ở tphcm', 'chốt kèo ăn uống', 'quẹt quán tinder'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ăn gì?',
  },
  openGraph: {
    title: 'Hôm nay ăn gì? • Tiệm chốt kèo ăn uống Sài Gòn',
    description: '0s đắn đo, chốt ngay quán ngon TP.HCM. Quẹt chọn quán 1 mình hoặc tạo phòng chốt kèo nhóm cùng bạn bè!',
    siteName: 'Hôm nay ăn gì?',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hôm nay ăn gì? • Chốt kèo ăn uống Sài Gòn 0 giây',
    description: 'Tìm quán ngon quanh bạn tức thì hoặc tạo phòng quẹt chọn quán ăn cùng hội nhóm như Tinder!',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#E84A27',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[#EFECE6] flex justify-center text-bistro-ink font-sans selection:bg-bistro-mustard selection:text-bistro-ink">
        {/* Mobile Shell Constraint */}
        <div className="w-full max-w-[430px] min-h-dvh bg-bistro-cream border-x border-bistro-border relative flex flex-col shadow-2xl pb-24">
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <PwaInstallPrompt />
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
