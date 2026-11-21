import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Hôm nay ăn gì? - Tiệm chốt kèo ăn uống Sài Gòn'
export const size = {
  width: 1200,
  height: 630
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF8F0',
          backgroundImage: 'radial-gradient(#EFECE6 2px, transparent 2px)',
          backgroundSize: '24px 24px',
          fontFamily: 'sans-serif',
          padding: '40px 60px'
        }}
      >
        {/* Main Bistro Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#FAF7F2',
            border: '6px solid #1C1917',
            borderRadius: '40px',
            boxShadow: '16px 16px 0px #1C1917',
            padding: '46px 64px',
            maxWidth: '1020px',
            width: '100%'
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F4B942',
              border: '3px solid #1C1917',
              borderRadius: '999px',
              padding: '10px 24px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#1C1917',
              marginBottom: '20px',
              boxShadow: '4px 4px 0px #1C1917'
            }}
          >
            🍜 0s ĐẮN ĐO • TIỆM CHỐT KÈO ĂN UỐNG SÀI GÒN
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '66px',
              fontWeight: 900,
              color: '#1C1917',
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: '16px'
            }}
          >
            Hôm nay ăn gì?
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#78716C',
              textAlign: 'center',
              maxWidth: '820px',
              lineHeight: 1.4,
              marginBottom: '32px'
            }}
          >
            Gợi ý 1 quán ngon chuẩn gu trong 0 giây hoặc tạo phòng quẹt quán cùng hội bạn bè như Tinder!
          </div>

          {/* Chips */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                backgroundColor: '#E84A27',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: 700,
                border: '3px solid #1C1917',
                boxShadow: '4px 4px 0px #1C1917'
              }}
            >
              🔥 Quẹt chọn 1 quán
            </div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1C1917',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: 700,
                border: '3px solid #1C1917',
                boxShadow: '4px 4px 0px #1C1917'
              }}
            >
              👥 Chốt kèo nhóm Tinder
            </div>
            <div
              style={{
                backgroundColor: '#2A7B56',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: 700,
                border: '3px solid #1C1917',
                boxShadow: '4px 4px 0px #1C1917'
              }}
            >
              🧾 Hóa đơn POS & Vòng quay
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size
    }
  )
}
