import { useState, useEffect, useRef } from "react"
import "../styles/CardDeck.css"

// Depois da revelação: 1 s só com a carta escolhida, então todas viradas
// até fechar. O servidor começa a música quando o baralho fecha
// (START_DELAY_MS no servidor).
const REVEAL_ALL_DELAY_MS = 1000
const CLOSE_DELAY_MS = 3000

/**
 * Baralho controlado pelo servidor: as cartas chegam viradas (só a
 * quantidade) e os títulos só existem depois de `reveal`, que é igual para
 * todos na sala.
 */
function CardDeck({ cardCount, pickedIndex, reveal, onPick, onClose, onRevealEnd }) {
  const [revealAll, setRevealAll] = useState(false)
  const onRevealEndRef = useRef(onRevealEnd)

  useEffect(() => {
    onRevealEndRef.current = onRevealEnd
  })

  useEffect(() => {
    if (!reveal) return

    const revealTimer = setTimeout(() => setRevealAll(true), REVEAL_ALL_DELAY_MS)
    const closeTimer = setTimeout(() => onRevealEndRef.current(), CLOSE_DELAY_MS)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(closeTimer)
    }
  }, [reveal])

  const selectedIndex = reveal ? reveal.cardIndex : pickedIndex
  const locked = reveal != null || pickedIndex != null
  const cards = Array.from({ length: cardCount }, (_, index) => index)

  function isRevealed(index) {
    return reveal != null && (revealAll || index === reveal.cardIndex)
  }

  return (
    <div className="card-overlay">
      <div className="card-container">
        <button
          className="card-close-btn"
          onClick={onClose}
          title="Fechar"
        >
          ✕
        </button>

        <h2 className="card-title">Escolha sua próxima música</h2>
        <p className="card-subtitle">{cardCount} {cardCount !== 1 ? 'músicas disponíveis' : 'música disponível'}</p>

        <div className="cards-grid">
          {cards.map((index) => (
            <div
              key={index}
              className={`card ${isRevealed(index) ? 'revealed' : 'hidden'} ${
                selectedIndex === index ? 'selected' : ''
              }`}
              onClick={() => !locked && onPick(index)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <div className="card-icon">🎵</div>
                </div>
                <div className="card-back">
                  <div className="card-content">
                    <p className="card-song-title">{reveal?.cardTitles[index] ?? ''}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reveal && revealAll && (
          <div className="results-info">
            <p className="results-text">Reproduzindo: <strong>{reveal.cardTitles[reveal.cardIndex]}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardDeck;
