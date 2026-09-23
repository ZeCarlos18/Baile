import { useCallback, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRoom } from "../hooks/useRoom"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"
import CardDeck from "../components/CardDeck"
import ShareRoom from "../components/ShareRoom"
import "../styles/Room.css"

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

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
    videoEnded
  } = useRoom(roomCode, { onNotFound: handleNotFound })

  const queue = room?.queue ?? []
  const nowPlaying = room?.nowPlaying ?? null
  const hasOpenDraw = Boolean(room?.draw)

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
                    <li key={v.id.videoId} className="result-item">
                      <div className="result-info">
                        <p className="result-title">{v.snippet.title}</p>
                      </div>
                      <button
                        className="btn-add-video"
                        onClick={() => addVideo(v.id.videoId, v.snippet.title)}
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
            {nowPlaying && (
              <div className="player-section">
                <Player
                  videoId={nowPlaying.entry.videoId}
                  playKey={nowPlaying.entry.entryId}
                  startAt={nowPlaying.startAt}
                  onVideoEnd={() => videoEnded(nowPlaying.entry.entryId)}
                />
              </div>
            )}

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
    </div>
  )
}

export default RoomPage
