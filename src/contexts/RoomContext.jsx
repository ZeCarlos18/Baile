import { createContext, useState } from "react"

export const RoomContext = createContext()

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState("")
  const [queue, setQueue] = useState([])
  const [currentVideo, setCurrentVideo] = useState(null)

  return (
    <RoomContext.Provider
      value={{
        roomCode,
        setRoomCode,
        queue,
        setQueue,
        currentVideo,
        setCurrentVideo
      }}
    >
      {children}
    </RoomContext.Provider>
  )
}