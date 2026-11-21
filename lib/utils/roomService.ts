import { supabase } from '@/lib/supabase/client'
import { SEED_RESTAURANTS } from '@/lib/constants/seedData'
import { VotingRoom, RoomVote, RoomStatus, RestaurantWithDistance, RoomParticipant, RoomVotingResultItem } from '@/types'
import { calculateHaversineDistance } from './queryRestaurants'

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LOCAL_ROOMS_KEY = 'hom_nay_an_gi_local_rooms_v1'
const LOCAL_VOTES_KEY = 'hom_nay_an_gi_local_votes_v1'

// Tạo kênh BroadcastChannel để test đa tab mượt mà trên cùng máy
let localBroadcast: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcast = new BroadcastChannel('hom_nay_an_gi_room_sync')
  } catch (e) {
    localBroadcast = null
  }
}

/**
 * Sinh mã phòng ngẫu nhiên 6 ký tự dễ đọc (VD: K3X9A2)
 */
export function generateRoomCode(): string {
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length))
  }
  return result
}

/**
 * Kiểm tra xem Supabase đã được cấu hình key thực tế hay chưa
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return Boolean(url && !url.includes('demo-supabase') && key && !key.includes('demo-anon-key'))
}

// ==========================================
// LOCAL STORAGE FALLBACK HELPERS
// ==========================================
function getLocalRooms(): Record<string, VotingRoom> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

function saveLocalRoom(room: VotingRoom) {
  if (typeof window === 'undefined') return
  try {
    const rooms = getLocalRooms()
    rooms[room.id] = room
    rooms[room.room_code] = room
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms))
    localBroadcast?.postMessage({ type: 'ROOM_UPDATE', room })
  } catch (e) {}
}

function getLocalVotes(roomId: string): RoomVote[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY)
    const allVotes: RoomVote[] = raw ? JSON.parse(raw) : []
    return allVotes.filter((v) => v.room_id === roomId)
  } catch (e) {
    return []
  }
}

function saveLocalVote(vote: RoomVote) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY)
    const allVotes: RoomVote[] = raw ? JSON.parse(raw) : []
    // Tránh vote trùng cùng 1 người và 1 quán
    const filtered = allVotes.filter(
      (v) => !(v.room_id === vote.room_id && v.voter_name === vote.voter_name && v.restaurant_id === vote.restaurant_id)
    )
    filtered.push(vote)
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(filtered))
    localBroadcast?.postMessage({ type: 'VOTE_UPDATE', vote })
  } catch (e) {}
}

// ==========================================
// CORE ROOM SERVICE API
// ==========================================

/**
 * Tạo phòng bỏ phiếu nhóm mới (Host)
 */
export async function createVotingRoom({
  hostName,
  radiusMeters = 5000,
  vibeSelected = null,
  hostLat,
  hostLng
}: {
  hostName: string
  radiusMeters?: number
  vibeSelected?: string | null
  hostLat: number
  hostLng: number
}): Promise<{ room: VotingRoom; restaurants: RestaurantWithDistance[] }> {
  const roomCode = generateRoomCode()

  // 1. Lọc lấy ra tối đa 10 quán ăn quanh vị trí của Host
  const maxDistance = radiusMeters + 200
  const candidateRestaurants = SEED_RESTAURANTS
    .map((r) => ({
      ...r,
      distance_meters: calculateHaversineDistance(hostLat, hostLng, r.lat, r.lng)
    }))
    .filter((r) => r.distance_meters <= maxDistance)

  // Nếu trong bán kính có ít hơn 4 quán, lấy các quán gần nhất
  const sorted = [...candidateRestaurants].sort((a, b) => a.distance_meters - b.distance_meters)
  const pool = sorted.length >= 4 ? sorted : SEED_RESTAURANTS.map((r) => ({
    ...r,
    distance_meters: calculateHaversineDistance(hostLat, hostLng, r.lat, r.lng)
  })).sort((a, b) => a.distance_meters - b.distance_meters)

  const selectedRestaurants = pool.slice(0, 10)
  const restaurantIds = selectedRestaurants.map((r) => r.id)

  const newRoom: VotingRoom = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `room_${Date.now()}`,
    room_code: roomCode,
    host_name: hostName.trim(),
    restaurant_ids: restaurantIds,
    status: 'waiting',
    vibe_selected: vibeSelected,
    radius_meters: radiusMeters,
    host_lat: hostLat,
    host_lng: hostLng,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  // 2. Lưu vào Supabase nếu đã cấu hình
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('voting_rooms')
        .insert({
          room_code: newRoom.room_code,
          host_name: newRoom.host_name,
          restaurant_ids: newRoom.restaurant_ids,
          status: newRoom.status,
          vibe_selected: newRoom.vibe_selected,
          radius_meters: newRoom.radius_meters,
          host_lat: newRoom.host_lat,
          host_lng: newRoom.host_lng
        })
        .select()
        .single()

      if (!error && data) {
        newRoom.id = data.id
      }
    } catch (e) {
      console.warn('Lỗi lưu phòng vào Supabase, sử dụng bộ nhớ cục bộ:', e)
    }
  }

  // Luôn lưu vào local fallback
  saveLocalRoom(newRoom)

  return {
    room: newRoom,
    restaurants: selectedRestaurants
  }
}

/**
 * Lấy thông tin phòng qua mã code (6 ký tự)
 */
export async function getVotingRoomByCode(
  roomCode: string
): Promise<{ room: VotingRoom | null; restaurants: RestaurantWithDistance[] }> {
  const code = roomCode.toUpperCase().trim()
  let room: VotingRoom | null = null

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('voting_rooms')
        .select('*')
        .eq('room_code', code)
        .single()

      if (!error && data) {
        room = data as VotingRoom
      }
    } catch (e) {
      console.warn('Lỗi lấy phòng từ Supabase:', e)
    }
  }

  // Fallback đọc từ local cache
  if (!room) {
    const localRooms = getLocalRooms()
    room = localRooms[code] || null
  }

  if (!room) {
    return { room: null, restaurants: [] }
  }

  // Lấy chi tiết các quán theo restaurant_ids
  const hostLat = room.host_lat || 10.779785
  const hostLng = room.host_lng || 106.699018

  const restaurants = room.restaurant_ids
    .map((id) => {
      const found = SEED_RESTAURANTS.find((r) => r.id === id)
      if (!found) return null
      return {
        ...found,
        distance_meters: calculateHaversineDistance(hostLat, hostLng, found.lat, found.lng)
      }
    })
    .filter(Boolean) as RestaurantWithDistance[]

  return { room, restaurants }
}

/**
 * Cập nhật trạng thái phòng ('waiting' -> 'voting' -> 'completed')
 */
export async function updateRoomStatus(roomId: string, status: RoomStatus): Promise<boolean> {
  let updated = false

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('voting_rooms')
        .update({ status })
        .eq('id', roomId)

      if (!error) updated = true
    } catch (e) {}
  }

  // Cập nhật local
  const rooms = getLocalRooms()
  for (const key of Object.keys(rooms)) {
    if (rooms[key].id === roomId) {
      rooms[key].status = status
      saveLocalRoom(rooms[key])
      updated = true
    }
  }

  return updated
}

/**
 * Gửi lượt Quẹt Trái (Chê) / Quẹt Phải (Thích) của 1 thành viên
 */
export async function castVote({
  roomId,
  voterName,
  restaurantId,
  isLike
}: {
  roomId: string
  voterName: string
  restaurantId: string
  isLike: boolean
}): Promise<RoomVote> {
  const vote: RoomVote = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vote_${Date.now()}_${Math.random()}`,
    room_id: roomId,
    voter_name: voterName.trim(),
    restaurant_id: restaurantId,
    is_like: isLike,
    created_at: new Date().toISOString()
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('room_votes')
        .upsert(
          {
            room_id: roomId,
            voter_name: vote.voter_name,
            restaurant_id: vote.restaurant_id,
            is_like: vote.is_like
          },
          { onConflict: 'room_id,voter_name,restaurant_id' }
        )
    } catch (e) {
      console.warn('Lỗi ghi vote vào Supabase:', e)
    }
  }

  saveLocalVote(vote)
  return vote
}

/**
 * Lấy danh sách tất cả các lượt vote của phòng
 */
export async function getRoomVotes(roomId: string): Promise<RoomVote[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('room_votes')
        .select('*')
        .eq('room_id', roomId)

      if (!error && data) {
        return data as RoomVote[]
      }
    } catch (e) {}
  }

  return getLocalVotes(roomId)
}

/**
 * Thống kê danh sách thành viên tham gia và tiến độ quẹt
 */
export function computeRoomParticipants(
  room: VotingRoom,
  votes: RoomVote[],
  knownNames: string[] = []
): RoomParticipant[] {
  const totalTarget = room.restaurant_ids.length
  const map = new Map<string, number>()

  // Luôn đảm bảo Host có mặt
  map.set(room.host_name, 0)

  // Bổ sung các tên đã tham gia
  knownNames.forEach((name) => {
    if (name) map.set(name, 0)
  })

  // Đếm số lượt vote theo từng người
  votes.forEach((v) => {
    const current = map.get(v.voter_name) || 0
    map.set(v.voter_name, current + 1)
  })

  return Array.from(map.entries()).map(([name, votedCount]) => ({
    name,
    isHost: name === room.host_name,
    votedCount,
    totalTarget,
    isDone: totalTarget > 0 && votedCount >= totalTarget
  }))
}

/**
 * Tính toán kết quả bầu chọn quán chiến thắng
 */
export function computeVotingResults(
  room: VotingRoom,
  restaurants: RestaurantWithDistance[],
  votes: RoomVote[]
): {
  winner: RestaurantWithDistance | null
  rankedList: Array<{
    restaurant: RestaurantWithDistance
    likesCount: number
    dislikesCount: number
    totalVotes: number
    matchRate: number
  }>
  isInstantMatch: boolean
} {
  if (restaurants.length === 0) {
    return { winner: null, rankedList: [], isInstantMatch: false }
  }

  // Danh sách các người tham gia đã vote
  const voters = Array.from(new Set(votes.map((v) => v.voter_name)))
  const totalParticipants = Math.max(1, voters.length)

  const statsMap = new Map<string, { likes: number; dislikes: number }>()
  restaurants.forEach((r) => {
    statsMap.set(r.id, { likes: 0, dislikes: 0 })
  })

  votes.forEach((v) => {
    const stat = statsMap.get(v.restaurant_id)
    if (stat) {
      if (v.is_like) stat.likes++
      else stat.dislikes++
    }
  })

  const rankedList = restaurants.map((restaurant) => {
    const stat = statsMap.get(restaurant.id) || { likes: 0, dislikes: 0 }
    const totalVotes = stat.likes + stat.dislikes
    const matchRate = totalParticipants > 0 ? Math.round((stat.likes / totalParticipants) * 100) : 0
    return {
      restaurant,
      likesCount: stat.likes,
      dislikesCount: stat.dislikes,
      totalVotes,
      matchRate
    }
  })

  // Sắp xếp: Nhiều Like nhất -> Tỉ lệ Match cao nhất -> Đánh giá cao nhất
  rankedList.sort((a, b) => {
    if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount
    if (b.matchRate !== a.matchRate) return b.matchRate - a.matchRate
    return b.restaurant.rating - a.restaurant.rating
  })

  const winner = rankedList[0]?.restaurant || null
  const isInstantMatch =
    totalParticipants >= 2 && rankedList[0]?.likesCount === totalParticipants

  return {
    winner,
    rankedList,
    isInstantMatch
  }
}

/**
 * Lắng nghe cập nhật thời gian thực (Supabase Realtime + Broadcast fallback)
 */
export function subscribeToRoomUpdates({
  roomId,
  onRoomUpdate,
  onVoteUpdate
}: {
  roomId: string
  onRoomUpdate?: (room: VotingRoom) => void
  onVoteUpdate?: (vote: RoomVote) => void
}): () => void {
  let supabaseChannel: any = null

  // 1. Supabase Realtime channel
  if (isSupabaseConfigured()) {
    try {
      supabaseChannel = supabase
        .channel(`room_${roomId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'voting_rooms', filter: `id=eq.${roomId}` },
          (payload) => {
            if (payload.new && onRoomUpdate) {
              onRoomUpdate(payload.new as VotingRoom)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'room_votes', filter: `room_id=eq.${roomId}` },
          (payload) => {
            if (payload.new && onVoteUpdate) {
              onVoteUpdate(payload.new as RoomVote)
            }
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('Lỗi tạo kênh Realtime Supabase:', e)
    }
  }

  // 2. BroadcastChannel đa tab cục bộ
  const handleBroadcast = (event: MessageEvent) => {
    if (!event.data) return
    if (event.data.type === 'ROOM_UPDATE' && event.data.room?.id === roomId && onRoomUpdate) {
      onRoomUpdate(event.data.room)
    }
    if (event.data.type === 'VOTE_UPDATE' && event.data.vote?.room_id === roomId && onVoteUpdate) {
      onVoteUpdate(event.data.vote)
    }
  }

  localBroadcast?.addEventListener('message', handleBroadcast)

  // Trả về hàm hủy đăng ký (clean up)
  return () => {
    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel)
    }
    localBroadcast?.removeEventListener('message', handleBroadcast)
  }
}
