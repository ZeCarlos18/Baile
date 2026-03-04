import { useState, useEffect } from "react"
import { useSocket } from "../hooks/useSocket"
import "../styles/CardDeck.css"

function CardDeck({ queue, roomCode, onCardSelected, onClose }) {
  const socket = useSocket()
  const [cards, setCards] = useState([])
  const [revealedCards, setRevealedCards] = useState(new Set())
  const [selectedCard, setSelectedCard] = useState(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (queue && queue.length > 0) {
      // Embaralhar a fila para criar as cartas
      const shuffledQueue = [...queue];
      for (let i = shuffledQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
      }

      const newCards = shuffledQueue.map((video, index) => {
        const originalIndex = queue.findIndex(v => v.id === video.id);
        return {
          cardIndex: index,
          originalIndex: originalIndex,
          video: video,
          isVisible: false
        };
      });

      setCards(newCards);
    }
  }, [queue]);

  function handleCardClick(cardIndex) {
    if (revealedCards.has(cardIndex)) return; // Já foi revelada

    console.log(`🎴 [CardDeck] Usuário clicou no card: ${cardIndex}`)

    setSelectedCard(cardIndex);
    
    // Revelar esta carta
    setRevealedCards(new Set([...revealedCards, cardIndex]));

    // Se é a primeira volta, revelar todas após 1 segundo
    if (revealedCards.size === 0) {
      setTimeout(() => {
        const allRevealed = new Set(cards.map(c => c.cardIndex));
        setRevealedCards(allRevealed);
        setShowResults(true);

        // Após 2 segundos, executar seleção
        setTimeout(() => {
          console.log(`🎴 [CardDeck] Executando seleção de card: ${cardIndex}`)
          executeCardSelection(cardIndex);
        }, 2000);
      }, 1000);
    }
  }

  function executeCardSelection(cardIndex) {
    const card = cards.find(c => c.cardIndex === cardIndex);
    if (!card) return;

    console.log(`📤 [CardDeck] Emitindo 'select-card' para roomCode: ${roomCode}`)
    console.log(`📤 [CardDeck] Dados enviados:`, {
      roomCode: roomCode,
      selectedCardIndex: cardIndex,
      videoTitle: card.video.title
    })

    // Emitir evento de seleção
    socket.emit('select-card', {
      roomCode: roomCode,
      selectedCardIndex: cardIndex,
      cardDetails: {
        originalIndex: card.originalIndex,
        video: card.video
      }
    });

    console.log(`✅ [CardDeck] Evento 'select-card' emitido com sucesso`)

    // Fechar após animação
    setTimeout(() => {
      onClose();
    }, 1000);
  }

  if (cards.length === 0) {
    return null;
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
        <p className="card-subtitle">{cards.length} música{cards.length !== 1 ? 's' : ''} disponível{cards.length !== 1 ? 's' : ''}</p>

        <div className="cards-grid">
          {cards.map((card) => (
            <div
              key={card.cardIndex}
              className={`card ${revealedCards.has(card.cardIndex) ? 'revealed' : 'hidden'} ${
                selectedCard === card.cardIndex ? 'selected' : ''
              }`}
              onClick={() => !selectedCard && handleCardClick(card.cardIndex)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <div className="card-icon">🎵</div>
                </div>
                <div className="card-back">
                  <div className="card-content">
                    <p className="card-song-title">{card.video.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showResults && (
          <div className="results-info">
            <p className="results-text">Reproduzindo: <strong>{cards.find(c => c.cardIndex === selectedCard)?.video.title}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardDeck;
