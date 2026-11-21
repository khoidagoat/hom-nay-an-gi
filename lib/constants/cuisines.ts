import { GooglePriceTier } from '@/types'

export interface CuisineItem {
  key: string
  label: string
  iconName: string
}

export const CUISINES: CuisineItem[] = [
  { key: 'Cơm', label: 'Cơm tấm / Cơm niêu', iconName: 'Utensils' },
  { key: 'Bún/Phở', label: 'Bún / Phở / Hủ tiếu', iconName: 'Soup' },
  { key: 'Lẩu/Nướng', label: 'Lẩu / Nướng / BBQ', iconName: 'Flame' },
  { key: 'Đồ Á', label: 'Đồ Á (Hàn/Nhật/Hoa)', iconName: 'Fish' },
  { key: 'Đồ Âu', label: 'Đồ Âu / Pizza / Steak', iconName: 'Pizza' },
  { key: 'Ăn vặt', label: 'Ăn vặt / Bánh mì', iconName: 'Sandwich' }
]

export const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km (Đi bộ)' },
  { value: 2000, label: '2 km (Cực gần)' },
  { value: 3000, label: '3 km (Vừa vặn)' },
  { value: 5000, label: '5 km (Vi vu)' },
  { value: 10000, label: '10 km (Không ngại xa)' },
  { value: 15000, label: '15 km (Toàn thành phố)' }
]

// Mức giá chuẩn theo Google Maps / Google Places
export interface GooglePriceOption {
  tier: GooglePriceTier
  label: string
  rangeText: string
  symbol: string
  description: string
}

export const GOOGLE_PRICE_TIERS: GooglePriceOption[] = [
  {
    tier: 1,
    label: '1 - 100k',
    rangeText: 'Dưới 100k',
    symbol: '$',
    description: 'Bình dân, ăn trưa, sinh viên'
  },
  {
    tier: 2,
    label: '100k - 200k',
    rangeText: '100k - 200k',
    symbol: '$$',
    description: 'Tầm trung, quán ăn gia đình'
  },
  {
    tier: 3,
    label: '200k - 600k',
    rangeText: '200k - 600k',
    symbol: '$$$',
    description: 'Cao cấp, buffet, lẩu nướng xịn'
  },
  {
    tier: 4,
    label: '> 600k',
    rangeText: 'Trên 600k',
    symbol: '$$$$',
    description: 'Sang trọng, fine dining, steakhouse'
  }
]
