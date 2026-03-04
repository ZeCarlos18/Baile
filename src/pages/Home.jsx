import { useContext } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import { useNavigate } from "react-router-dom"
import "../styles/Home.css"

function Home() {
  const { setRoomCode } = useContext(RoomContext)
  const socket = useSocket()
  const navigate = useNavigate()

  function createRoom() {
    socket.emit("create-room")
    
    socket.once("room-created", (code) => {
      setRoomCode(code)
      navigate(`/room/${code}`)
    })
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🎵 Baile</h1>
        <button className="create-room-btn" onClick={createRoom}>
          Criar Sala
        </button>
      </div>
    </div>
  )
}

export default Home