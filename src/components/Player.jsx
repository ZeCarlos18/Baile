import { usePlayer } from "../hooks/usePlayer"
import { useEffect } from "react"

function Player({ videoId, onVideoEnd, startTime, onPlayStateChange, onPlayerReady }) {
  const playerRef = usePlayer(videoId, onVideoEnd, startTime, onPlayStateChange)

  // Quando o player estiver pronto, passar a referência para o pai
  useEffect(() => {
    if (playerRef.current && onPlayerReady) {
      onPlayerReady(playerRef.current)
    }
  }, [playerRef, onPlayerReady])

  return <div id="player"></div>
}

export default Player