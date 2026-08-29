import { ClubIcon, DiamondIcon, HeartIcon, SpadeIcon } from "./icons"

const SUIT_ICONS = {
  spade: SpadeIcon,
  heart: HeartIcon,
  diamond: DiamondIcon,
  club: ClubIcon
}

/**
 * Carta ilustrativa da Home.
 *
 * É um elemento puramente visual: não representa uma música real e não
 * substitui o `CardDeck`, que continua sendo o sistema de cartas da sala.
 */
function MusicCard({
  suit = "spade",
  tone = "violet",
  featured = false,
  className = "",
  style,
  children
}) {
  const Suit = SUIT_ICONS[suit] ?? SUIT_ICONS.spade

  return (
    <div
      className={`mcard mcard--${tone} ${featured ? "mcard--featured" : ""} ${className}`}
      style={style}
    >
      <span className="mcard__pip mcard__pip--top">
        <Suit size="100%" />
      </span>
      <div className="mcard__body">{children}</div>
      <span className="mcard__pip mcard__pip--bottom">
        <Suit size="100%" />
      </span>
    </div>
  )
}

export default MusicCard
