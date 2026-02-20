import { useEffect, useState } from 'react'
import '../styles/NowPlaying.css'

function NowPlaying({ track, socket }) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!socket) return

    socket.on('progress_update', (data) => {
      setProgress(data.progress)
      setDuration(data.duration)
    })

    return () => socket.off('progress_update')
  }, [socket])

  const progressPercentage = (progress / duration) * 100

  return (
    <div className="now-playing">
      {track ? (
        <>
          <div className="album-art">
            <img 
              src={track.album?.images?.[0]?.url} 
              alt={track.name}
              onError={(e) => e.target.src = '/placeholder-album.png'}
            />
            <div className="playing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="track-info">
            <h2>{track.name}</h2>
            <p className="artist">
              {track.artists?.map(a => a.name).join(', ')}
            </p>
          </div>

          <div className="progress-container">
            <div className="time">{formatTime(progress)}</div>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="time">{formatTime(duration)}</div>
          </div>
        </>
      ) : (
        <div className="no-track">
          <p>Nenhuma música tocando</p>
          <p className="subtitle">Adicione músicas à fila para começar</p>
        </div>
      )}
    </div>
  )
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default NowPlaying