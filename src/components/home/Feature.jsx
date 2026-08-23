/**
 * Item de benefício exibido ao redor da composição principal da Hero.
 * `icon` recebe um dos componentes de `icons.jsx`.
 */
function Feature({ icon, title, children }) {
  const Icon = icon

  return (
    <div className="feature">
      <span className="feature__icon">
        <Icon size={20} />
      </span>
      <div className="feature__text">
        <h3 className="feature__title">{title}</h3>
        <p className="feature__desc">{children}</p>
      </div>
    </div>
  )
}

export default Feature
