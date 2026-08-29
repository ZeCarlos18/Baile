import { useContext, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RoomContext } from "../contexts/RoomContext"
import { useSocket } from "../hooks/useSocket"
import CardFan from "../components/home/CardFan"
import Feature from "../components/home/Feature"
import HomeBackground from "../components/home/HomeBackground"
import JoinRoomModal from "../components/home/JoinRoomModal"
import MusicCard from "../components/home/MusicCard"
import {
  BoltIcon,
  CardsIcon,
  LogoMark,
  MusicNoteIcon,
  PlusIcon,
  QuestionIcon,
  SearchIcon,
  SparkleIcon,
  UsersIcon
} from "../components/home/icons"
import "../styles/Home.css"

const STEPS = [
  {
    title: "Crie a sala",
    text: "Um clique gera um código único e você já entra na sala."
  },
  {
    title: "Chame a galera",
    text: "Compartilhe o link do convite para seus amigos entrarem na mesma sala."
  },
  {
    title: "Montem a fila",
    text: "Busque no YouTube e adicione músicas — a fila é construída por todo mundo."
  },
  {
    title: "Revelem a próxima",
    text: "Vire uma carta: a música escondida nela toca para todos, sincronizada."
  }
]

function Home() {
  const { setRoomCode } = useContext(RoomContext)
  const socket = useSocket()
  const navigate = useNavigate()

  const [isCreating, setIsCreating] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const creatingTimeout = useRef(null)

  useEffect(() => {
    return () => clearTimeout(creatingTimeout.current)
  }, [])

  function createRoom() {
    if (isCreating) return

    setIsCreating(true)
    // Trava apenas o estado visual do botão caso o servidor não responda.
    creatingTimeout.current = setTimeout(() => setIsCreating(false), 8000)

    socket.emit("create-room")

    socket.once("room-created", (code) => {
      clearTimeout(creatingTimeout.current)
      setIsCreating(false)
      setRoomCode(code)
      navigate(`/room/${code}`)
    })
  }

  function joinRoom(code) {
    setShowJoinModal(false)
    setRoomCode(code)
    navigate(`/room/${code}`)
  }

  return (
    <div className="home">
      <HomeBackground />

      <header className="home__nav">
        <a className="brand" href="#top" aria-label="Baile — início">
          <LogoMark size={38} />
          <span className="brand__name">Baile</span>
        </a>

        <nav className="home__nav-actions">
          <a className="nav-link" href="#como-funciona">
            <QuestionIcon size={18} />
            Como funciona
          </a>
        </nav>
      </header>

      <main className="hero" id="top">
        <MusicCard suit="heart" tone="violet" className="hero__float hero__float--left">
          <span className="hero__float-note">
            <MusicNoteIcon size="100%" />
          </span>
        </MusicCard>

        <MusicCard suit="diamond" tone="pink" className="hero__float hero__float--right">
          <span className="hero__float-note">
            <MusicNoteIcon size="100%" />
          </span>
        </MusicCard>

        <div className="hero__head">
          <h1 className="hero__title">
            Não escolha a próxima música.{" "}
            <span className="hero__accent">Revele.</span>
          </h1>
          <p className="hero__subtitle">
            Crie uma sala, reúna seus amigos e descubra qual música será a próxima.
          </p>
        </div>

        <div className="hero__stage">
          <div className="hero__features hero__features--left">
            <Feature icon={UsersIcon} title="Colabore em tempo real">
              Todos adicionam, todos decidem.
            </Feature>
            <Feature icon={SearchIcon} title="Busque no YouTube">
              Encontre qualquer música e adicione à fila.
            </Feature>
            <Feature icon={BoltIcon} title="Sincronizado">
              Todos ouvindo juntos, sem desencontro.
            </Feature>
          </div>

          <div className="hero__center">
            <CardFan />

            <div className="hero__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={createRoom}
                aria-busy={isCreating}
              >
                <PlusIcon size={20} />
                {isCreating ? "Criando sala..." : "Criar Sala"}
              </button>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowJoinModal(true)}
              >
                <UsersIcon size={20} />
                Entrar em uma Sala
              </button>
            </div>
          </div>

          <div className="hero__features hero__features--right">
            <Feature icon={CardsIcon} title="Jogo de cartas">
              Um jeito divertido e justo de escolher a próxima.
            </Feature>
            <Feature icon={SparkleIcon} title="Descubra juntos">
              Surpresa, emoção e a trilha sonora do seu momento.
            </Feature>
          </div>
        </div>
      </main>

      <section className="steps" id="como-funciona">
        <h2 className="steps__title">Como funciona</h2>
        <p className="steps__subtitle">
          Quatro passos entre abrir o Baile e a primeira carta virada.
        </p>

        <ol className="steps__list">
          {STEPS.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step__number">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="home__footer">
        <LogoMark size={26} />
        <span>Baile — a próxima música é uma surpresa coletiva.</span>
      </footer>

      {showJoinModal && (
        <JoinRoomModal onClose={() => setShowJoinModal(false)} onJoin={joinRoom} />
      )}
    </div>
  )
}

export default Home
