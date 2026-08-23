import { useEffect, useRef, useState } from "react"
import { ArrowRightIcon, CloseIcon, UsersIcon } from "./icons"

/**
 * Aceita o código da sala ou o próprio link compartilhado pelo `ShareRoom`
 * (`.../room/ABC123`) e devolve apenas o código normalizado.
 */
function parseRoomCode(rawValue) {
  const value = String(rawValue ?? "").trim()
  if (!value) return null

  const fromLink = value.match(/\/room\/([^/?#\s]+)/i)
  const code = (fromLink ? fromLink[1] : value).toUpperCase()

  return /^[A-Z0-9]{4,10}$/.test(code) ? code : null
}

function JoinRoomModal({ onClose, onJoin }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  function handleSubmit(event) {
    event.preventDefault()

    const code = parseRoomCode(value)

    if (!code) {
      setError("Informe o código da sala ou cole o link do convite.")
      return
    }

    onJoin(code)
  }

  return (
    <div className="modal" role="presentation" onMouseDown={onClose}>
      <div
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-room-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={18} />
        </button>

        <span className="modal__icon">
          <UsersIcon size={22} />
        </span>

        <h2 className="modal__title" id="join-room-title">
          Entrar em uma sala
        </h2>
        <p className="modal__subtitle">
          Digite o código que seus amigos compartilharam — ou cole o link do convite.
        </p>

        <form className="modal__form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="modal__input"
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError("")
            }}
            placeholder="Ex.: A1B2C3"
            autoComplete="off"
            spellCheck="false"
            aria-invalid={Boolean(error)}
          />

          {error && (
            <p className="modal__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block">
            Entrar na sala
            <ArrowRightIcon size={19} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinRoomModal
