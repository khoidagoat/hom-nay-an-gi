import { VibeDefinition } from '@/types'

export const VIBES: VibeDefinition[] = [
  {
    key: 'mat_me',
    title: 'Trời nóng cần mát',
    shortLabel: 'Máy lạnh phà phà',
    emoji: '☀️',
    subtitle: 'Ưu tiên quán có máy lạnh trốn nắng',
    iconName: 'Wind',
    preset: {
      has_ac: true,
      vibe_tag: 'mat_me'
    }
  },
  {
    key: 'cuoi_thang',
    title: 'Cuối tháng hết tiền',
    shortLabel: 'Ăn ngon dưới 45k',
    emoji: '💸',
    subtitle: 'Ngon - Bổ - Rẻ, cứu rỗi chiếc ví',
    iconName: 'Coins',
    preset: {
      max_price: 1,
      vibe_tag: 'binh_dan'
    }
  },
  {
    key: 'hen_ho',
    title: 'Hẹn hò lãng mạn',
    shortLabel: 'Không gian ấm cúng',
    emoji: '🕯️',
    subtitle: 'Không gian đẹp, máy lạnh, hợp đi 2 người',
    iconName: 'Heart',
    preset: {
      has_ac: true,
      vibe_tag: 'hen_ho'
    }
  }
]

// Vị trí mặc định (Quận 1, TP.HCM)
export const DEFAULT_COORDINATES = {
  lat: 10.776000,
  lng: 106.698000,
  addressLabel: 'Quận 1, TP.HCM'
}

// Các địa điểm quận tại TP.HCM để chọn nhanh khu vực
export const FALLBACK_LOCATIONS = [
  { name: 'Quận 1', lat: 10.776000, lng: 106.698000 },
  { name: 'Quận 3', lat: 10.783000, lng: 106.685000 },
  { name: 'Quận 4', lat: 10.760000, lng: 106.703000 },
  { name: 'Quận 5', lat: 10.755000, lng: 106.666000 },
  { name: 'Quận 6', lat: 10.748000, lng: 106.643000 },
  { name: 'Quận 7', lat: 10.738000, lng: 106.712000 },
  { name: 'Quận 8', lat: 10.742000, lng: 106.675000 },
  { name: 'Quận 10', lat: 10.772500, lng: 106.668000 },
  { name: 'Quận 11', lat: 10.765000, lng: 106.650000 },
  { name: 'Quận Bình Thạnh', lat: 10.803000, lng: 106.703000 },
  { name: 'Quận Phú Nhuận', lat: 10.798500, lng: 106.683000 },
  { name: 'Quận Tân Bình', lat: 10.798000, lng: 106.652000 },
  { name: 'Quận Tân Phú', lat: 10.790000, lng: 106.626000 },
  { name: 'Quận Gò Vấp', lat: 10.838000, lng: 106.668000 },
  { name: 'TP. Thủ Đức', lat: 10.806000, lng: 106.736000 },
  { name: 'Quận Bình Tân', lat: 10.743500, lng: 106.611500 }
]
