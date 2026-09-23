import { useCallback, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRoom } from "../hooks/useRoom"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"
import CardDeck from "../components/CardDeck"
import ShareRoom from "../components/ShareRoom"
import "../styles/Room.css"

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

// A API do YouTube devolve títulos com entidades HTML (&amp;, &#39;...)
function decodeHtml(text) {
  return new DOMParser().parseFromString(text, "text/html").documentElement.textContent
}

// Quem chegou por um link ainda não interagiu com a página, e o navegador
// bloqueia som sem um gesto. Quem veio clicando na Home já está liberado.
function hasUserGesture() {
  return navigator.userActivation?.hasBeenActive ?? false
}

// O código vem sempre da URL. A `key` faz a página montar do zero ao trocar
// de sala, então nada da sala anterior (busca, baralho, player) sobra.
function RoomPage() {
  const { code } = useParams()
  const roomCode = code.toUpperCase()
  return <Room key={roomCode} roomCode={roomCode} />
}

function Room({ roomCode }) {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [needsGesture, setNeedsGesture] = useState(() => !hasUserGesture())
  const playerRef = useRef(null)

  const handleNotFound = useCallback(() => {
    alert("Sala não encontrada")
    navigate("/")
  }, [navigate])

  const {
    room,
    deck,
    addVideo,
    startDraw,
    pickCard,
    dismissDeck,
    finishReveal,
    videoEnded,
    videoError
  } = useRoom(roomCode, { onNotFound: handleNotFound })

  const queue = room?.queue ?? []
  const nowPlaying = room?.nowPlaying ?? null
  const hasOpenDraw = Boolean(room?.draw)

  // O clique no overlay é o gesto que libera o áudio
  function enterParty() {
    setNeedsGesture(false)
    playerRef.current?.resume()
  }

  async function search(query) {
    try {
      // videoEmbeddable: só vídeos que o dono permite tocar fora do YouTube
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`
      )

      if (!res.ok) {
        throw new Error("Erro na API")
      }

      const data = await res.json()
      setResults(data.items.map(item => ({
        videoId: item.id.videoId,
        title: decodeHtml(item.snippet.title)
      })))
    } catch (error) {
      console.error(error)
      alert("Erro ao buscar vídeos")
    }
  }

  return (
    <div className="room-container">
      <div className="room-background"></div>

      <div className="room-content">
        <header className="room-header">
          <h1 className="room-title">🎵 Baralhô</h1>
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
                    <li key={v.videoId} className="result-item">
                      <div className="result-info">
                        <p className="result-title">{v.title}</p>
                      </div>
                      <button
                        className="btn-add-video"
                        onClick={() => addVideo(v.videoId, v.title)}
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
            <Player
              ref={playerRef}
              nowPlaying={nowPlaying}
              onEnded={videoEnded}
              onError={videoError}
              onBlocked={() => setNeedsGesture(true)}
              onPlaying={() => setNeedsGesture(false)}
            />

            <div className="queue-section">
              <QueueList queue={queue} />

              <button
                className="btn-choose-music"
                onClick={startDraw}
                disabled={queue.length === 0 && !hasOpenDraw}
              >
                <span className="choose-icon">🎴</span>
                <span className="choose-text">Escolher Próxima</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {deck && !deck.dismissed && (
        <CardDeck
          key={deck.drawId}
          cardCount={deck.cardCount}
          pickedIndex={deck.pickedIndex}
          reveal={deck.reveal}
          onPick={(cardIndex) => pickCard(deck.drawId, cardIndex)}
          onClose={dismissDeck}
          onRevealEnd={finishReveal}
        />
      )}

      {needsGesture && (
        <div className="sound-overlay" onClick={enterParty}>
          <button className="btn-choose-music">
            <span className="choose-icon">🔊</span>
            <span className="choose-text">Toque para entrar na festa</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default RoomPage
