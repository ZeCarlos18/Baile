import { createContext, useState, useCallback } from 'react'

export const RoomContext = createContext()

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null)
  const [queue, setQueue] = useState([])
  const [currentTrack, setCurrentTrack] = useState(null)
  const [roulette, setRoulette] = useState(null)
  const [socket, setSocket] = useState(null)

  const handleRoomUpdate = useCallback((updatedRoom) => {
    setRoom(updatedRoom)
    setCurrentTrack(updatedRoom.currentTrack)
    setQueue(updatedRoom.queue || [])
  }, [])

  const handleQueueUpdate = useCallback((newQueue) => {
    setQueue(newQueue)
  }, [])

  const handleRouletteStart = useCallback((rouletteData) => {
    setRoulette(rouletteData)
  }, [])

  return (
    <RoomContext.Provider value={{
      room,
      queue,
      currentTrack,
      roulette,
      socket,
      setSocket,
      handleRoomUpdate,
      handleQueueUpdate,
      handleRouletteStart,
      setRoulette,
    }}>
      {children}
    </RoomContext.Provider>
  )
}