import { useState } from 'react'
import '../styles/Queue.css'

function Queue({ tracks, socket, roomId, userIsPremium }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const handleRemoveTrack = (trackIndex) => {
    socket?.emit('remove_from_queue', { roomId, trackIndex })
  }

  const handleMoveTrack = (trackIndex, direction) => {
    socket?.emit('move_track', { roomId, trackIndex, direction })
  }

  return (
    <div className="queue-container">
      <h3>Fila de Reprodução</h3>
      
      {tracks.length === 0 ? (
        <div className="empty-queue">
          <p>Fila vazia</p>
          <p className="subtitle">Pesquise e adicione músicas acima</p>
        </div>
      ) : (
        <div className="queue-list">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className="queue-item"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="queue-item-info">
                <span className="queue-position">{index + 1}</span>
                <div className="queue-track-details">
                  <p className="queue-track-name">{track.name}</p>
                  <p className="queue-track-artist">
                    {track.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>

              {hoveredIndex === index && (
                <div className="queue-actions">
                  {index > 0 && (
                    <button 
                      onClick={() => handleMoveTrack(index, 'up')}
                      title="Mover para cima"
                    >
                      ⬆️
                    </button>
                  )}
                  {index < tracks.length - 1 && (
                    <button 
                      onClick={() => handleMoveTrack(index, 'down')}
                      title="Mover para baixo"
                    >
                      ⬇️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Queue