import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"
import CardDeck from "../components/CardDeck"
import ShareRoom from "../components/ShareRoom"
import "../styles/Room.css"

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

function Room() {
  const { code } = useParams()
  const { userId } = useContext(AuthContext)
  const {
    roomCode,
    setRoomCode,
    queue,
    setQueue,
    currentVideo,
    setCurrentVideo
  } = useContext(RoomContext)

  console.log(`👤 [Room.jsx] userId carregado:`, userId)

  const socket = useSocket()
  const [results, setResults] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [listenersSetup, setListenersSetup] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [playerRef, setPlayerRef] = useState(null)

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
        console.log(`✅ [Frontend] user-joined recebido:`, data);
        console.log(`📊 [Frontend] Fila pessoal recebida: ${data.queue ? data.queue.length : 0} música(s)`);
        console.log(`📊 [Frontend] Fila global recebida: ${data.globalQueue ? data.globalQueue.length : 0} música(s)`);
        
        if (data.queue && Array.isArray(data.queue)) {
          setQueue(data.queue);
          localStorage.setItem(`queue_${roomCode}`, JSON.stringify(data.queue));
          console.log(`💾 [Frontend] Fila pessoal salva no localStorage`);
        }
      })
      
      socket.on("video-added", (data) => {
        console.log(`🎵 [Frontend] Novo vídeo adicionado:`, data.video.title);
        // Novo vídeo foi adicionado - adiciona apenas o novo à fila pessoal
        const { video } = data
        setQueue(prevQueue => {
          const newQueue = [...prevQueue, video]
          console.log(`📝 [Frontend] Fila pessoal agora tem ${newQueue.length} música(s)`)
          // Salva automaticamente no localStorage
          localStorage.setItem(`queue_${roomCode}`, JSON.stringify(newQueue))
          return newQueue
        })
      })
      
      socket.on("play-video", (data) => {
        console.log(`▶️ [Frontend] play-video recebido:`, data.video.title)
        console.log(`👤 [Frontend] userId atual:`, userId)
        console.log(`👤 [Frontend] selectedByUserId do evento:`, data.selectedByUserId)
        console.log(`📊 [Frontend] userQueue recebida:`, data.userQueue ? `${data.userQueue.length} música(s)` : 'undefined')
        
        const video = data.video || data
        const elapsed = data.elapsedTime || 0
        
        setCurrentVideo(video)
        setElapsedTime(elapsed)
        setIsPlaying(true)
        
        // Atualiza fila pessoal APENAS se foi o próprio usuário que selecionou
        if (data.selectedByUserId === userId && data.userQueue) {
          console.log(`✅ [Frontend] MATCH! Atualizando fila pessoal de ${userId}`)
          console.log(`📝 [Frontend] Fila atualizada: ${data.userQueue.length} música(s)`)
          setQueue(data.userQueue)
          // Salva no localStorage
          localStorage.setItem(`queue_${roomCode}`, JSON.stringify(data.userQueue))
        } else if (data.selectedByUserId !== userId) {
          console.log(`⏭️ [Frontend] Não é a fila deste usuário (${data.selectedByUserId} !== ${userId})`)
        }
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

      socket.on("cards-revealed", (data) => {
        console.log(`🎴 [Frontend] cards-revealed recebido:`, data);
        console.log(`🎴 [Frontend] Cartas recebidas: ${data.cards ? data.cards.length : 0}`)
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
      socket.emit('sync-time', { roomCode })
    }, 5000)

    return () => clearInterval(interval)
  }, [currentVideo, roomCode, socket])

  function addVideo(video) {
    const videoData = {
      id: video.id.videoId,
      title: video.snippet.title
    }

    console.log(`🎵 [Frontend] Usuário ${userId} adicionando música:`, videoData.title);
    console.log(`🎵 [Frontend] Para sala ${roomCode}`);
    
    // Sempre adiciona à fila global. Usuário escolhe sua música via cartas
    socket.emit("add-video", {
      code: roomCode,
      video: videoData,
      playNow: false
    });
  }

  function requestCards() {
    console.log(`🎴 [Frontend] Solicitando cartas para usuário ${userId} na sala ${roomCode}`)
    console.log(`📊 [Frontend] Fila tem ${queue.length} música(s)`)
    
    if (queue.length === 0) {
      alert("Nenhuma música na fila!")
      return
    }
    
    setShowCards(true)
    socket.emit("request-cards", roomCode)
  }

  function handleCardClose() {
    setShowCards(false)
  }

  function handleVideoEnd() {
    if (queue && queue.length > 0) {
      setTimeout(() => {
        requestCards()
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

            <ShareRoom roomCode={roomCode} />
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
                className="btn-choose-music"
                onClick={requestCards}
                disabled={queue.length === 0}
              >
                <span className="choose-icon">🎴</span>
                <span className="choose-text">Escolher Próxima</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCards && (
        <CardDeck 
          queue={queue}
          roomCode={roomCode}
          onCardSelected={() => setShowCards(false)}
          onClose={handleCardClose}
        />
      )}
    </div>
  )
}

export default Room