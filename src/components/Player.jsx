import { usePlayer } from "../hooks/usePlayer"

function Player({ videoId, playKey, startAt, onVideoEnd }) {
  usePlayer({ videoId, playKey, startAt, onVideoEnd })

  return <div id="player"></div>
}

export default Player
