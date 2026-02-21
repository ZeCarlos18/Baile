import { useContext, useEffect, useState } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import Player from "../components/Player"
import SearchBar from "../components/SearchBar"
import QueueList from "../components/QueueList"

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
function Room() {
  const {
    roomCode,
    queue,
    setQueue,
    currentVideo,
    setCurrentVideo
  } = useContext(RoomContext)

  const socket = useSocket()
  const [results, setResults] = useState([])

  useEffect(() => {
    socket.on("update-queue", setQueue)
    socket.on("play-video", setCurrentVideo)
  }, [])

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
    socket.emit("add-video", {
      code: roomCode,
      video: {
        id: video.id.videoId,
        title: video.snippet.title
      }
    })
  }

  function spin() {
    socket.emit("spin-wheel", roomCode)
  }

  return (
    <div>
      <h2>Sala: {roomCode}</h2>

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

      {currentVideo && <Player videoId={currentVideo.id} />}
    </div>
  )
}

export default Room