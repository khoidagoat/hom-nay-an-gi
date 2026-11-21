import { Database } from './database'

export type RestaurantRow = Database['public']['Tables']['restaurants']['Row']
export type VotingRoomRow = Database['public']['Tables']['voting_rooms']['Row']
export type RoomVoteRow = Database['public']['Tables']['room_votes']['Row']

// Google Price Level:
// 1 = 1 - 100k ($)
// 2 = 100k - 200k ($$)
// 3 = 200k - 600k ($$$)
// 4 = > 600k ($$$$)
export type GooglePriceTier = 1 | 2 | 3 | 4

export interface RestaurantWithDistance {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  cuisine: string
  price_level: GooglePriceTier
  price_range_text: string
  rating: number // e.g. 4.8
  review_count: number // e.g. 1250
  has_ac: boolean
  has_car_parking: boolean
  free_moto_parking: boolean
  image_url: string
  is_real_image?: boolean // false nếu dùng ảnh minh họa món
  sub_cuisine?: string // com_tam, pho, bun_bo, hu_tieu, banh_mi, ...
  report_count?: number // số lượt người dùng báo lỗi
  vibe_tags: string[]
  description: string | null
  distance_meters: number
}

// Lý do báo lỗi thông tin quán ăn
export type RestaurantReportReason = 'wrong_address' | 'closed' | 'wrong_info'

// Các thẻ Vibe ngữ cảnh
export type VibeKey = 
  | 'mat_me'      // ☀️ Trời nóng cần mát (has_ac = true)
  | 'cuoi_thang'  // 💸 Cuối tháng hết tiền (price_level = 1, 1-100k)
  | 'hen_ho'      // 🕯️ Hẹn hò lãng mạn (vibe_tags contains 'hen_ho', không gian đẹp, máy lạnh)

export type ParkingFilterOption = 'none' | 'moto' | 'car' | 'both'

export interface VibeDefinition {
  key: VibeKey
  title: string
  shortLabel: string
  emoji: string
  subtitle: string
  iconName: string
  preset: {
    has_ac?: boolean
    max_price?: GooglePriceTier
    vibe_tag?: string
  }
}

export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number
  addressLabel?: string
}

export interface ActiveFiltersState {
  vibes: VibeKey[] // Multi-select Vibes
  parking: ParkingFilterOption // 'none' | 'moto' | 'car' | 'both'
  radiusMeters: number // 1000, 2000, 3000, 5000, 10000, 15000
  cuisine: string | null // null = Tất cả
  priceTiers: GooglePriceTier[] // Multi-select Google price tiers (1, 2, 3, 4)
}

export interface MealHistoryItem {
  restaurantId: string
  restaurantName: string
  cuisine: string
  address?: string
  image_url?: string
  price_range_text?: string
  rating?: number
  timestamp: number
  dateString: string
}

export interface RoomVotingResultItem {
  restaurant_id: string
  name: string
  address: string
  cuisine: string
  price_range_text: string
  rating: number
  review_count: number
  image_url: string
  lat: number
  lng: number
  likes_count: number
  dislikes_count: number
  total_votes: number
}

// Trạng thái phòng Chốt kèo nhóm
export type RoomStatus = 'waiting' | 'voting' | 'completed'

export interface VotingRoom {
  id: string
  room_code: string
  host_name: string
  restaurant_ids: string[]
  status: RoomStatus
  vibe_selected: string | null
  radius_meters: number
  host_lat: number | null
  host_lng: number | null
  created_at: string
  expires_at: string
}

export interface RoomVote {
  id: string
  room_id: string
  voter_name: string
  restaurant_id: string
  is_like: boolean
  created_at: string
}

export interface RoomParticipant {
  name: string
  isHost: boolean
  votedCount: number
  totalTarget: number
  isDone: boolean
}
