import { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { RoomContext } from '../contexts/RoomContext'
import { useSocket } from '../hooks/useSocket'
import NowPlaying from '../components/NowPlaying'
import Queue from '../components/Queue'
import SearchMusic from '../components/SearchMusic'
import Roulette from '../components/Roulette'
import '../styles/Dashboard.css'

function Dashboard() {
  const { roomId } = useParams()
  const { user } = useContext(AuthContext)
  const { room, currentTrack, queue, roulette, setSocket } = useContext(RoomContext)
  const { socket, connected } = useSocket(roomId)
  const [showRoulette, setShowRoulette] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (socket) {
      setSocket(socket)
    }
  }, [socket, setSocket])

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎵 Baile da Gaiola</h1>
          <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <div className="header-right">
          <span className="room-name">{room?.name}</span>
          <span className="user-info">{user.display_name}</span>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="now-playing-section">
          <NowPlaying track={currentTrack} socket={socket} />
        </section>

        <section className="content-section">
          <div className="search-section">
            <SearchMusic socket={socket} roomId={roomId} />
          </div>

          <div className="queue-section">
            <Queue 
              tracks={queue} 
              socket={socket} 
              roomId={roomId}
              userIsPremium={user.product === 'premium'}
            />
          </div>
        </section>

        {showRoulette && roulette && (
          <Roulette 
            tracks={roulette.tracks}
            onVote={(selectedIndex) => {
              socket?.emit('vote_track', { roomId, selectedIndex })
            }}
            socket={socket}
          />
        )}
      </main>
    </div>
  )
}

export default Dashboard