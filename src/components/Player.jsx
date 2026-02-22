import { usePlayer } from "../hooks/usePlayer"

function Player({ videoId, onVideoEnd }) {
  usePlayer(videoId, onVideoEnd)

  return <div id="player"></div>
}

export default Player