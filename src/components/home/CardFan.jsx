import MusicCard from "./MusicCard"
import { MusicNoteIcon } from "./icons"

/**
 * Leque de cartas da Hero. Decorativo — comunica a ideia
 * "qual será a próxima música?" sem qualquer lógica de jogo.
 *
 * `slot` é o multiplicador de deslocamento horizontal em relação ao centro.
 */
const FAN = [
  { id: "far-left", suit: "club", tone: "violet", slot: -2, angle: -19, lift: 30, layer: 1 },
  { id: "left", suit: "club", tone: "violet", slot: -1, angle: -9.5, lift: 12, layer: 2 },
  { id: "center", suit: "spade", tone: "violet", slot: 0, angle: 0, lift: -16, layer: 4, featured: true },
  { id: "right", suit: "diamond", tone: "pink", slot: 1, angle: 9.5, lift: 12, layer: 2 },
  { id: "far-right", suit: "heart", tone: "pink", slot: 2, angle: 19, lift: 30, layer: 1 }
]

function CardFan() {
  return (
    <div className="fan" aria-hidden="true">
      <div className="fan__glow" />

      <div className="fan__rings">
        <span className="fan__ring fan__ring--1" />
        <span className="fan__ring fan__ring--2" />
        <span className="fan__ring fan__ring--3" />
      </div>

      <div className="fan__cards">
        {FAN.map((card) => (
          <MusicCard
            key={card.id}
            suit={card.suit}
            tone={card.tone}
            featured={card.featured}
            className={`fan__card fan__card--${card.id}`}
            style={{
              "--fan-slot": card.slot,
              "--fan-angle": `${card.angle}deg`,
              "--fan-lift": `${card.lift}px`,
              "--fan-layer": card.layer
            }}
          >
            {card.featured && (
              <div className="fan__question">
                <MusicNoteIcon size="100%" />
                <p>
                  Próxima
                  <br />
                  música?
                </p>
              </div>
            )}
          </MusicCard>
        ))}
      </div>
    </div>
  )
}

export default CardFan
