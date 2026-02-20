import { useState, useEffect } from 'react'
import '../styles/Roulette.css'

function Roulette({ tracks, onVote, socket }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!voted && selectedIndex === null) {
            const randomIndex = Math.floor(Math.random() * tracks.length)
            setSelectedIndex(randomIndex)
            onVote(randomIndex)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [voted, selectedIndex, tracks.length, onVote])

  const handleVote = (index) => {
    setSelectedIndex(index)
    setVoted(true)
    onVote(index)
  }

  return (
    <div className="roulette-overlay">
      <div className="roulette-modal">
        <h2>Próxima Música!</h2>
        <p className="timer">Tempo para votação: <strong>{timeLeft}s</strong></p>

        <div className="roulette-wheel">
          {tracks.map((track, index) => (
            <div
              key={index}
              className={`wheel-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => !voted && handleVote(index)}
            >
              <img 
                src={track.album?.images?.[2]?.url}
                alt={track.name}
              />
            </div>
          ))}
        </div>

        <div className="roulette-info">
          {selectedIndex !== null && (
            <>
              <p className="selected-track">{tracks[selectedIndex]?.name}</p>
              <p className="selected-artist">
                {tracks[selectedIndex]?.artists?.map(a => a.name).join(', ')}
              </p>
            </>
          )}
        </div>

        {!voted && tracks.length > 0 && (
          <p className="vote-text">Clique em uma música para votar!</p>
        )}
      </div>
    </div>
  )
}

export default Roulette