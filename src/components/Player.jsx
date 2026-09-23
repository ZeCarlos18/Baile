import { useImperativeHandle, useRef } from "react"
import { usePlayer } from "../hooks/usePlayer"

// Fica sempre montado (o player do YouTube é criado uma vez só) e apenas
// se esconde quando não há nada tocando. `ref` expõe `resume()` e `player`.
function Player({ ref, nowPlaying, onEnded, onError, onBlocked, onPlaying }) {
  const containerRef = useRef(null)
  const { resume, getPlayer } = usePlayer({
    containerRef,
    nowPlaying,
    onEnded,
    onError,
    onBlocked,
    onPlaying
  })

  useImperativeHandle(ref, () => ({
    resume,
    get player() {
      return getPlayer()
    }
  }), [resume, getPlayer])

  return (
    <div className="player-section" style={nowPlaying ? undefined : { display: "none" }}>
      <div ref={containerRef}></div>
    </div>
  )
}

export default Player
