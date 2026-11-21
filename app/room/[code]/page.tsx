'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { RefreshCw, AlertCircle, ArrowLeft, Users } from 'lucide-react'
import { VotingRoom, RestaurantWithDistance, RoomVote, Coordinates } from '@/types'
import { DEFAULT_COORDINATES } from '@/lib/constants/vibes'
import { getSavedUserLocation } from '@/lib/utils/storage'
import {
  getVotingRoomByCode,
  updateRoomStatus,
  castVote,
  getRoomVotes,
  computeRoomParticipants,
  computeVotingResults,
  subscribeToRoomUpdates
} from '@/lib/utils/roomService'
import RoomLobby from '@/components/group/RoomLobby'
import RoomSwipe from '@/components/group/RoomSwipe'
import RoomReceipt from '@/components/group/RoomReceipt'

export default function RoomPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const roomCode = (params?.code || '').toUpperCase()

  const [isLoading, setIsLoading] = useState(true)
  const [room, setRoom] = useState<VotingRoom | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([])
  const [votes, setVotes] = useState<RoomVote[]>([])
  const [currentVoterName, setCurrentVoterName] = useState('')
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_COORDINATES)
  const [knownNames, setKnownNames] = useState<string[]>([])

  // 1. Khởi tạo voter name & user location
  useEffect(() => {
    const savedLoc = getSavedUserLocation()
    if (savedLoc) setUserLocation(savedLoc)

    const savedName = localStorage.getItem('hom_nay_an_gi_voter_name') || ''
    if (savedName) {
      setCurrentVoterName(savedName)
      setKnownNames((prev) => (prev.includes(savedName) ? prev : [...prev, savedName]))
    }
  }, [])

  // 2. Tải thông tin phòng và danh sách quán
  const loadRoomData = useCallback(async () => {
    if (!roomCode) return
    setIsLoading(true)

    const { room: fetchedRoom, restaurants: fetchedRestaurants } = await getVotingRoomByCode(roomCode)

    if (fetchedRoom) {
      setRoom(fetchedRoom)
      setRestaurants(fetchedRestaurants)

      // Kiểm tra nếu là Host
      const isHostSaved = localStorage.getItem(`room_host_${fetchedRoom.room_code}`) === 'true'
      if (isHostSaved && !currentVoterName) {
        setCurrentVoterName(fetchedRoom.host_name)
      }

      // Tải các lượt vote đã có
      const existingVotes = await getRoomVotes(fetchedRoom.id)
      setVotes(existingVotes)
    }

    setIsLoading(false)
  }, [roomCode, currentVoterName])

  useEffect(() => {
    loadRoomData()
  }, [loadRoomData])

  // 3. Đăng ký Realtime Updates
  useEffect(() => {
    if (!room?.id) return

    const unsubscribe = subscribeToRoomUpdates({
      roomId: room.id,
      onRoomUpdate: (updatedRoom) => {
        setRoom((prev) => (prev ? { ...prev, ...updatedRoom } : updatedRoom))
      },
      onVoteUpdate: (newVote) => {
        setVotes((prev) => {
          const exists = prev.some(
            (v) =>
              v.room_id === newVote.room_id &&
              v.voter_name === newVote.voter_name &&
              v.restaurant_id === newVote.restaurant_id
          )
          if (exists) return prev
          return [...prev, newVote]
        })

        // Tự động thêm tên người vote vào danh sách thành viên biết được
        setKnownNames((prev) => (prev.includes(newVote.voter_name) ? prev : [...prev, newVote.voter_name]))
      }
    })

    return () => unsubscribe()
  }, [room?.id])

  // 4. Tính toán danh sách người tham gia
  const participants = useMemo(() => {
    if (!room) return []
    return computeRoomParticipants(room, votes, knownNames)
  }, [room, votes, knownNames])

  // 5. Tính toán kết quả bầu chọn
  const votingResults = useMemo(() => {
    if (!room || restaurants.length === 0) {
      return { winner: null, rankedList: [], isInstantMatch: false }
    }
    return computeVotingResults(room, restaurants, votes)
  }, [room, restaurants, votes])

  // Kiểm tra nếu tất cả thành viên trong phòng đều đã quẹt xong
  useEffect(() => {
    if (
      room &&
      room.status === 'voting' &&
      participants.length >= 1 &&
      participants.every((p) => p.isDone)
    ) {
      // Tự động kết thúc phòng khi mọi người đã quẹt xong
      updateRoomStatus(room.id, 'completed').then(() => {
        setRoom((prev) => (prev ? { ...prev, status: 'completed' } : null))
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      })
    }
  }, [room, participants])

  // Xử lý khi Host bấm Bắt đầu quẹt quán
  const handleStartVoting = async () => {
    if (!room) return
    await updateRoomStatus(room.id, 'voting')
    setRoom((prev) => (prev ? { ...prev, status: 'voting' } : null))
  }

  // Xử lý khi thành viên quẹt Like/Dislike 1 quán
  const handleVote = async (restaurantId: string, isLike: boolean) => {
    if (!room || !currentVoterName) return

    const newVote = await castVote({
      roomId: room.id,
      voterName: currentVoterName,
      restaurantId,
      isLike
    })

    setVotes((prev) => {
      const filtered = prev.filter(
        (v) => !(v.voter_name === currentVoterName && v.restaurant_id === restaurantId)
      )
      return [...filtered, newVote]
    })
  }

  // Host kết thúc sớm
  const handleForceComplete = async () => {
    if (!room) return
    await updateRoomStatus(room.id, 'completed')
    setRoom((prev) => (prev ? { ...prev, status: 'completed' } : null))
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  // Khách nhập tên
  const handleJoinName = (name: string) => {
    setCurrentVoterName(name)
    localStorage.setItem('hom_nay_an_gi_voter_name', name)
    setKnownNames((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }

  // ==========================================
  // RENDER TRẠNG THÁI LOADING / LỖI
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-bistro-mustard border-2 border-bistro-ink shadow-[4px_4px_0px_#1C1917] flex items-center justify-center animate-bounce mb-3">
          <RefreshCw className="w-8 h-8 text-bistro-ink animate-spin" />
        </div>
        <p className="font-display font-bold text-lg text-bistro-ink">
          Đang vào phòng #{roomCode}...
        </p>
        <p className="text-xs text-bistro-muted">Đang kết nối danh sách quán ngon</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-stone-200 border-2 border-bistro-ink shadow-[3px_3px_0px_#1C1917] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-bistro-muted" />
        </div>
        <h3 className="font-display font-extrabold text-2xl text-bistro-ink mb-1">
          Không tìm thấy phòng #{roomCode}
        </h3>
        <p className="text-xs text-bistro-muted max-w-[280px] mb-6 leading-relaxed">
          Mã phòng không chính xác hoặc phòng này đã kết thúc sau 24 giờ.
        </p>
        <Link
          href="/group"
          className="tactile-btn bg-bistro-mustard text-bistro-ink font-bold py-3 px-5 rounded-xl text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang nhóm</span>
        </Link>
      </div>
    )
  }

  const isHost = currentVoterName === room.host_name || localStorage.getItem(`room_host_${room.room_code}`) === 'true'

  // ==========================================
  // RENDER 3 PHASE CỦA PHÒNG CHỐT KÈO
  // ==========================================

  // Phase 1: PHÒNG CHỜ (LOBBY)
  if (room.status === 'waiting') {
    return (
      <RoomLobby
        room={room}
        currentVoterName={currentVoterName}
        participants={participants}
        isHost={isHost}
        onStartVoting={handleStartVoting}
        onJoinName={handleJoinName}
      />
    )
  }

  // Phase 2: QUẸT THẺ TINDER (SWIPING)
  if (room.status === 'voting') {
    return (
      <RoomSwipe
        room={room}
        voterName={currentVoterName || 'Bạn'}
        restaurants={restaurants}
        participants={participants}
        onVote={handleVote}
        onForceComplete={handleForceComplete}
        isHost={isHost}
      />
    )
  }

  // Phase 3: HÓA ĐƠN CHỐT KÈO & VÒNG QUAY MAY MẮN (RECEIPT & ROULETTE)
  if (room.status === 'completed' && votingResults.winner) {
    const participantNames = participants.map((p) => p.name)
    return (
      <RoomReceipt
        room={room}
        winner={votingResults.winner}
        rankedList={votingResults.rankedList}
        participants={participantNames.length > 0 ? participantNames : [room.host_name]}
        userLocation={userLocation}
        onReset={() => router.push('/group')}
      />
    )
  }

  return null
}
