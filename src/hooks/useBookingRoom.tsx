import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoomId } from '@/data/rooms'

interface BookingRoomCtx {
  roomId: RoomId
  setRoomId: (r: RoomId) => void
}

const Ctx = createContext<BookingRoomCtx>(null as unknown as BookingRoomCtx)

export function BookingRoomProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<RoomId>('marrok')
  return <Ctx.Provider value={{ roomId, setRoomId }}>{children}</Ctx.Provider>
}

export function useBookingRoom() {
  return useContext(Ctx)
}
