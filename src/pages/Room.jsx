import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"
import Roulette from "../components/Roulette"
import ShareRoom from "../components/ShareRoom"
import "../styles/Room.css"

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

function Room() {
  const { code } = useParams()
  const {
    roomCode,
    setRoomCode,
    queue,
    setQueue,
    currentVideo,
    setCurrentVideo
  } = useContext(RoomContext)

  const socket = useSocket()
  const [results, setResults] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [listenersSetup, setListenersSetup] = useState(false)
  const [showRoulette, setShowRoulette] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [playerRef, setPlayerRef] = useState(null)
  const [selectedRouletteIndex, setSelectedRouletteIndex] = useState(null)
  const [selectedRouletteVideo, setSelectedRouletteVideo] = useState(null)
  const [rouletteQueueSnapshot, setRouletteQueueSnapshot] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  const [votesCount, setVotesCount] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [votesNeeded, setVotesNeeded] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (code && !roomCode) {
      setRoomCode(code)
    }
  }, [code, roomCode, setRoomCode])

  useEffect(() => {
    if (roomCode) {
      socket.emit("join-room", roomCode)
    }
  }, [roomCode, socket])

  useEffect(() => {
    if (!listenersSetup && roomCode) {
      socket.on("user-joined", (data) => {
        setQueue(data.queue)
        setCurrentVideo(data.currentVideo)
        setElapsedTime(data.elapsedTime || 0)
        if (data.currentVideo) {
          setIsPlaying(true)
        }
      })
      
      socket.on("update-queue", (newQueue) => {
        setQueue(newQueue)
      })
      
      socket.on("play-video", (data) => {
        const video = data.video || data
        const elapsed = data.elapsedTime || 0
        
        setCurrentVideo(video)
        setElapsedTime(elapsed)
        setIsPlaying(true)
      })

      socket.on("roulette-voting-started", (data) => {
        setSelectedRouletteIndex(data.selectedIndex)
        setSelectedRouletteVideo(data.selectedVideo)
        setRouletteQueueSnapshot(data.queue)
        setVotesCount(data.votesCount)
        setTotalUsers(data.totalUsers)
        setVotesNeeded(data.votesNeeded)
        setIsVoting(true)
        setShowRoulette(true)
      })

      socket.on("roulette-votes-updated", (data) => {
        setVotesCount(data.votesCount)
        setTotalUsers(data.totalUsers)
        setVotesNeeded(data.votesNeeded)
      })

      socket.on("start-roulette", (data) => {
        setSelectedRouletteIndex(data.selectedIndex)
        setSelectedRouletteVideo(data.selectedVideo)
        setRouletteQueueSnapshot(data.queue)
        setIsVoting(false)
        setShowRoulette(true)
        setHasVoted(false)
      })

      socket.on("sync-time-response", (data) => {
        if (playerRef && playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime()
          const diff = Math.abs(currentTime - data.currentTime)
          
          if (diff > 1.5) {
            playerRef.current.seekTo(data.currentTime)
          }
        }
      })

      setListenersSetup(true)
    }

    return () => {}
  }, [listenersSetup, roomCode, socket, setQueue, setCurrentVideo, playerRef, isPlaying])

  async function search(query) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`
      )

      if (!res.ok) {
        throw new Error("Erro na API")
      }

      const data = await res.json()
      setResults(data.items)
    } catch (error) {
      console.error(error)
      alert("Erro ao buscar vídeos")
    }
  }

  useEffect(() => {
    if (!currentVideo || !roomCode) return

    const interval = setInterval(() => {
      socket.emit('sync-time')
    }, 5000)

    return () => clearInterval(interval)
  }, [currentVideo, roomCode, socket])

  function addVideo(video) {
    const videoData = {
      id: video.id.videoId,
      title: video.snippet.title
    }

    if (!currentVideo) {
      setIsPlaying(true)
      socket.emit("add-video", {
        code: roomCode,
        video: videoData,
        playNow: true
      })
    } else {
      socket.emit("add-video", {
        code: roomCode,
        video: videoData,
        playNow: false
      })
    }
  }

  function spin() {
    if (queue.length === 0) {
      alert("Nenhuma música na fila!")
      return
    }
    
    if (queue.length === 1) {
      const video = queue[0]
      socket.emit("next-video")
      return
    }
    
    setHasVoted(true)
    socket.emit("request-roulette", roomCode)
  }

  function handleSpinComplete(selectedIndex) {
    setTimeout(() => {
      setShowRoulette(false)
    }, 2000)
  }

  function handleVideoEnd() {
    if (queue && queue.length > 0) {
      setTimeout(() => {
        spin()
      }, 1000)
    } else {
      setIsPlaying(false)
      setCurrentVideo(null)
    }
  }

  return (
    <div className="room-container">
      <div className="room-background"></div>
      
      <div className="room-content">
        <header className="room-header">
          <h1 className="room-title">🎵 Baile</h1>
          <h2 className="room-code">Sala: <span>{roomCode}</span></h2>
        </header>

        <div className="room-grid">
          {/* Coluna Esquerda - Busca e Lista de Resultados */}
          <div className="room-left">
            <ShareRoom roomCode={roomCode} />

            <div className="search-section">
              <h3 className="section-title">🔍 Buscar Música</h3>
              <SearchBar onSearch={search} />
            </div>

            {results.length > 0 && (
              <div className="results-section">
                <h3 className="section-title">Resultados ({results.length})</h3>
                <ul className="results-list">
                  {results.map((v) => (
                    <li key={v.id.videoId} className="result-item">
                      <div className="result-info">
                        <p className="result-title">{v.snippet.title}</p>
                      </div>
                      <button 
                        className="btn-add-video"
                        onClick={() => addVideo(v)}
                      >
                        ➕ Adicionar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna Direita - Player e Fila */}
          <div className="room-right">
            {currentVideo && (
              <div className="player-section">
                <Player 
                  videoId={currentVideo.id} 
                  onVideoEnd={handleVideoEnd} 
                  startTime={elapsedTime} 
                  onPlayerReady={setPlayerRef} 
                />
              </div>
            )}

            <div className="queue-section">
              <QueueList queue={queue} />
              
              <button 
                className="btn-spin-roulette"
                onClick={spin}
                disabled={queue.length === 0}
              >
                <span className="spin-icon">🎡</span>
                <span className="spin-text">Girar Roleta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRoulette && (
        <Roulette 
          queue={rouletteQueueSnapshot} 
          selectedIndex={selectedRouletteIndex}
          selectedVideo={selectedRouletteVideo}
          onSpinComplete={handleSpinComplete}
          isVoting={isVoting}
          votesCount={votesCount}
          totalUsers={totalUsers}
          votesNeeded={votesNeeded}
          hasVoted={hasVoted}
          roomCode={roomCode}
          onVote={() => {
            setHasVoted(true)
            socket.emit("vote-roulette", roomCode)
          }}
        />
      )}
    </div>
  )
}

export default Room