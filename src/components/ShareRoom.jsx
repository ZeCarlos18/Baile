import { useState } from "react"
import "../styles/ShareRoom.css"

function ShareRoom({ roomCode }) {
  const [copied, setCopied] = useState(false)

  // Gerar URL completa da sala
  const shareUrl = `${window.location.origin}/room/${roomCode}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    
    // Voltar ao estado normal após 2 segundos
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    // Se o navegador suportada Web Share API (mobile), usar native share
    if (navigator.share) {
      navigator.share({
        title: "🎵 Baile - Sala de Música",
        text: "Vem ouvir música comigo!",
        url: shareUrl
      })
    } else {
      // Caso contrário, copiar para clipboard
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
