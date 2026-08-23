import { SingleNoteIcon, MusicNoteIcon, SparkleIcon } from "./icons"

/**
 * Camada decorativa do fundo: brilhos, notas musicais flutuantes e faíscas.
 * Listas fixas (não aleatórias) para que a composição seja estável entre renders.
 */
const NOTES = [
  { left: "23%", top: "9vh", size: 34, dur: 9, delay: 0, rot: -12, double: false },
  { left: "8%", top: "56vh", size: 26, dur: 11, delay: 1.4, rot: 8, double: true },
  { left: "26%", top: "54vh", size: 30, dur: 10, delay: 2.6, rot: -6, double: false },
  { left: "76%", top: "12vh", size: 30, dur: 12, delay: 0.8, rot: 10, double: true },
  { left: "88%", top: "44vh", size: 24, dur: 9.5, delay: 2, rot: -10, double: false },
  { left: "70%", top: "70vh", size: 22, dur: 13, delay: 3.2, rot: 14, double: true }
]

const SPARKLES = [
  { left: "5%", top: "20vh", size: 14, delay: 0 },
  { left: "17%", top: "42vh", size: 10, delay: 1.1 },
  { left: "31%", top: "76vh", size: 12, delay: 2.3 },
  { left: "62%", top: "22vh", size: 10, delay: 1.7 },
  { left: "83%", top: "62vh", size: 13, delay: 0.6 },
  { left: "94%", top: "28vh", size: 11, delay: 2.8 }
]

function HomeBackground() {
  return (
    <div className="hbg" aria-hidden="true">
      <div className="hbg__glow hbg__glow--violet" />
      <div className="hbg__glow hbg__glow--pink" />
      <div className="hbg__glow hbg__glow--deep" />
      <div className="hbg__wave" />

      {NOTES.map((note, index) => (
        <span
          key={`note-${index}`}
          className="hbg__note"
          style={{
            left: note.left,
            top: note.top,
            width: note.size,
            height: note.size,
            "--rot": `${note.rot}deg`,
            animationDuration: `${note.dur}s`,
            animationDelay: `${note.delay}s`
          }}
        >
          {note.double ? <MusicNoteIcon size="100%" /> : <SingleNoteIcon size="100%" />}
        </span>
      ))}

      {SPARKLES.map((sparkle, index) => (
        <span
          key={`sparkle-${index}`}
          className="hbg__sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`
          }}
        >
          <SparkleIcon size="100%" />
        </span>
      ))}
    </div>
  )
}

export default HomeBackground
