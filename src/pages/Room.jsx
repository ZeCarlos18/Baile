import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"
import Roulette from "../components/Roulette"
import ShareRoom from "../components/ShareRoom"

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

      socket.on("start-roulette", (data) => {
        setSelectedRouletteIndex(data.selectedIndex)
        setSelectedRouletteVideo(data.selectedVideo)
        setRouletteQueueSnapshot(data.queue)
        setShowRoulette(true)
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
    socket.emit("spin-wheel", roomCode)
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
    <div>
      <h2>Sala: {roomCode}</h2>

      <ShareRoom roomCode={roomCode} />

      <SearchBar onSearch={search} />

      <ul>
        {results.map((v) => (
          <li key={v.id.videoId}>
            {v.snippet.title}
            <button onClick={() => addVideo(v)}>Adicionar</button>
          </li>
        ))}
      </ul>

      <QueueList queue={queue} />

      <button onClick={spin}>🎡 Girar Roleta</button>

      {currentVideo && <Player videoId={currentVideo.id} onVideoEnd={handleVideoEnd} startTime={elapsedTime} onPlayerReady={setPlayerRef} />}

      {showRoulette && (
        <Roulette 
          queue={rouletteQueueSnapshot} 
          selectedIndex={selectedRouletteIndex}
          selectedVideo={selectedRouletteVideo}
          onSpinComplete={handleSpinComplete}
        />
      )}
    </div>
  )
}

export default Room