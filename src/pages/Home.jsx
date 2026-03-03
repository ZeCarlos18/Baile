import { useContext } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import { useNavigate } from "react-router-dom"

function Home() {
  const { setRoomCode } = useContext(RoomContext)
  const socket = useSocket()
  const navigate = useNavigate()

  function createRoom() {
    console.log("🔄 Criando nova sala...")
    socket.emit("create-room")
    
    socket.once("room-created", (code) => {
      console.log("✅ Sala criada com código:", code)
      setRoomCode(code)
      navigate(`/room/${code}`)
    })
  }

  return (
    <div>
      <h1>🎵 Baile</h1>
      <button onClick={createRoom}>Criar Sala</button>
    </div>
  )
}

export default Home