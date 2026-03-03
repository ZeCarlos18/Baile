import { usePlayer } from "../hooks/usePlayer"

function Player({ videoId, onVideoEnd, startTime }) {
  usePlayer(videoId, onVideoEnd, startTime)

  return <div id="player"></div>
}

export default Player