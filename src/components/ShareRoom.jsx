import { useState } from "react"
import "../styles/ShareRoom.css"

function ShareRoom({ roomCode }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/room/${roomCode}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "🎵 Baile - Sala de Música",
        text: "Vem ouvir música comigo!",
        url: shareUrl
      })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="share-room-container">
      <div className="share-room-card">
        <h3>🎤 Convide seus amigos</h3>
        
        <div className="share-link-box">
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="share-link-input"
          />
          <button 
            onClick={handleCopy}
            className={`copy-btn ${copied ? 'copied' : ''}`}
          >
            {copied ? '✅ Copiado!' : '📋 Copiar'}
          </button>
        </div>

        {navigator.share && (
          <button onClick={handleShare} className="share-btn">
            📤 Compartilhar
          </button>
        )}

        <p className="share-info">
          Compartilhe este link com seus amigos para entrarem na sala!
        </p>
      </div>
    </div>
  )
}

export default ShareRoom
