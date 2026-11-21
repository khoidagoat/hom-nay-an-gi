import type { Metadata } from 'next'

interface RoomLayoutProps {
  children: React.ReactNode
  params: { code: string }
}

export async function generateMetadata({ params }: RoomLayoutProps): Promise<Metadata> {
  const code = (params?.code || '').toUpperCase()
  return {
    title: `Phòng chốt kèo #${code} • Hôm nay ăn gì?`,
    description: `Mời bạn vào phòng #${code} để quẹt chọn quán ăn cùng hội nhóm. Nhấn vào để cùng quẹt quán như Tinder ngay!`,
    openGraph: {
      title: `🎉 KÈO ĂN ĐỒNG THUẬN: Vào phòng #${code} quẹt quán ngay!`,
      description: `Host đang đợi bạn vào phòng để cùng chốt quán ăn ngon tại Sài Gòn. Quẹt chọn 10 quán ăn chuẩn vị!`,
      siteName: 'Hôm nay ăn gì?',
      locale: 'vi_VN',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `🎉 KÈO ĂN ĐỒNG THUẬN: Vào phòng #${code} quẹt quán ngay!`,
      description: `Mời bạn vào quẹt chọn quán ăn cùng hội bạn bè trong 0 giây!`
    }
  }
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
