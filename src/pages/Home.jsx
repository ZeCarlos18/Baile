import { useContext } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"

function Home() {
  const { setRoomCode } = useContext(RoomContext)
  const socket = useSocket()

  function createRoom() {
    socket.emit("create-room")
    socket.on("room-created", (code) => {
      setRoomCode(code)
      window.location.href = "/room"
    })
  }

  return (
    <div>
      <h1>YouTube Jam MVP</h1>
      <button onClick={createRoom}>Criar Sala</button>
    </div>
  )
}

export default Home