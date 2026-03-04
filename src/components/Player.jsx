import { usePlayer } from "../hooks/usePlayer"
import { useEffect } from "react"

function Player({ videoId, onVideoEnd, startTime, onPlayerReady }) {
  const playerRef = usePlayer(videoId, onVideoEnd, startTime)

  useEffect(() => {
    if (playerRef.current && onPlayerReady) {
      onPlayerReady(playerRef.current)
    }
  }, [playerRef, onPlayerReady])

  return <div id="player"></div>
}

export default Player