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
  const { code } = useParams() // Pegar código da URL
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

  // Setar roomCode do URL
  useEffect(() => {
    if (code && !roomCode) {
      console.log("📍 Definindo sala da URL:", code)
      setRoomCode(code)
    }
  }, [code, roomCode, setRoomCode])

  // Fazer join na sala quando roomCode é setado
  useEffect(() => {
    if (roomCode) {
      console.log("🚪 Entrando na sala:", roomCode)
      socket.emit("join-room", roomCode)
    }
  }, [roomCode, socket])

  // Configurar listeners apenas UMA VEZ
  useEffect(() => {
    if (!listenersSetup && roomCode) {
      console.log("🔌 Configurando listeners para sala:", roomCode)
      
      socket.on("update-queue", (newQueue) => {
        console.log("📊 Fila atualizada:", newQueue)
        setQueue(newQueue)
      })
      
      socket.on("play-video", (video) => {
        console.log("▶️ Recebido play-video:", video)
        setCurrentVideo(video)
        setIsPlaying(true)
      })

      setListenersSetup(true)
    }

    return () => {
      // Cleanup apenas se desmontar
      // Não remover listeners aqui para evitar duplicatas
    }
  }, [listenersSetup, roomCode, socket, setQueue, setCurrentVideo])

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

  function addVideo(video) {
    const videoData = {
      id: video.id.videoId,
      title: video.snippet.title
    }

    console.log("📝 Adicionando vídeo:", videoData)
    console.log("🎵 Vídeo atual:", currentVideo)
    console.log("📊 Sala:", roomCode)

    // Se não há vídeo tocando, toca imediatamente
    if (!currentVideo) {
      console.log("▶️ Nenhum vídeo tocando, tocando agora...")
      setIsPlaying(true)
      socket.emit("add-video", {
        code: roomCode,
        video: videoData,
        playNow: true // Flag para tocar imediatamente
      })
    } else {
      // Se há vídeo tocando, adiciona à fila
      console.log("⏳ Já tem vídeo tocando, adicionando à fila...")
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
    setShowRoulette(true)
  }

  function handleSpinComplete(selectedIndex) {
    // Emitir evento para o servidor girar
    socket.emit("spin-wheel", roomCode)
    
    // Fechar roleta após 2 segundos
    setTimeout(() => {
      setShowRoulette(false)
    }, 2000)
  }

  function handleVideoEnd() {
    console.log("Vídeo terminou. Fila:", queue)
    
    // Se há vídeos na fila, gira automaticamente
    if (queue && queue.length > 0) {
      console.log("Auto-girando roleta...")
      setTimeout(() => {
        spin()
      }, 1000) // Pequeno delay antes de girar
    } else {
      // Se não há fila, pausa
      setIsPlaying(false)
      setCurrentVideo(null)
      console.log("Nenhum vídeo na fila")
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

      {currentVideo && <Player videoId={currentVideo.id} onVideoEnd={handleVideoEnd} />}

      {showRoulette && (
        <Roulette 
          queue={queue} 
          onSpinComplete={handleSpinComplete}
        />
      )}
    </div>
  )
}

export default Room