export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          lat: number
          lng: number
          cuisine: string
          price_level: 1 | 2 | 3 | 4
          price_range_text: string
          rating: number
          review_count: number
          has_ac: boolean
          has_car_parking: boolean
          free_moto_parking: boolean
          image_url: string
          is_real_image: boolean
          sub_cuisine: string | null
          report_count: number
          vibe_tags: string[]
          description: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          lat: number
          lng: number
          cuisine: string
          price_level: 1 | 2 | 3 | 4
          price_range_text: string
          rating?: number
          review_count?: number
          has_ac?: boolean
          has_car_parking?: boolean
          free_moto_parking?: boolean
          image_url: string
          is_real_image?: boolean
          sub_cuisine?: string | null
          report_count?: number
          vibe_tags?: string[]
          description?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          lat?: number
          lng?: number
          cuisine?: string
          price_level?: 1 | 2 | 3 | 4
          price_range_text?: string
          rating?: number
          review_count?: number
          has_ac?: boolean
          has_car_parking?: boolean
          free_moto_parking?: boolean
          image_url?: string
          is_real_image?: boolean
          sub_cuisine?: string | null
          report_count?: number
          vibe_tags?: string[]
          description?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      voting_rooms: {
        Row: {
          id: string
          room_code: string
          host_name: string
          restaurant_ids: string[]
          status: 'waiting' | 'voting' | 'completed'
          vibe_selected: string | null
          radius_meters: number
          host_lat: number | null
          host_lng: number | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          room_code: string
          host_name: string
          restaurant_ids?: string[]
          status?: 'waiting' | 'voting' | 'completed'
          vibe_selected?: string | null
          radius_meters?: number
          host_lat?: number | null
          host_lng?: number | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          host_name?: string
          restaurant_ids?: string[]
          status?: 'waiting' | 'voting' | 'completed'
          vibe_selected?: string | null
          radius_meters?: number
          host_lat?: number | null
          host_lng?: number | null
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      room_votes: {
        Row: {
          id: string
          room_id: string
          voter_name: string
          restaurant_id: string
          is_like: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          voter_name: string
          restaurant_id: string
          is_like: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          voter_name?: string
          restaurant_id?: string
          is_like?: boolean
          created_at?: string
        }
        Relationships: []
      }
      restaurant_reports: {
        Row: {
          id: string
          restaurant_id: string
          reason: 'wrong_address' | 'closed' | 'wrong_info'
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          reason: 'wrong_address' | 'closed' | 'wrong_info'
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          reason?: 'wrong_address' | 'closed' | 'wrong_info'
          details?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nearby_restaurants: {
        Args: {
          user_lat: number
          user_lng: number
          radius_meters?: number
          filter_ac?: boolean | null
          filter_car_parking?: boolean | null
          price_tiers?: number[] | null
          cuisine_filter?: string | null
          vibe_filter?: string | null
          exclude_ids?: string[]
          limit_count?: number
        }
        Returns: {
          id: string
          name: string
          address: string
          lat: number
          lng: number
          cuisine: string
          price_level: number
          price_range_text: string
          rating: number
          review_count: number
          has_ac: boolean
          has_car_parking: boolean
          free_moto_parking: boolean
          image_url: string
          vibe_tags: string[]
          description: string | null
          distance_meters: number
        }[]
      }
      get_room_voting_results: {
        Args: {
          p_room_id: string
        }
        Returns: {
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
        }[]
      }
      report_restaurant: {
        Args: {
          p_restaurant_id: string
          p_reason: string
          p_details?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
