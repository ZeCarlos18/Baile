import { useState, useEffect } from "react"
import "../styles/Roulette.css"

function Roulette({ queue, onSpinComplete }) {
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasClickedSpin, setHasClickedSpin] = useState(false)

  const itemsCount = queue.length
  const itemAngle = 360 / itemsCount

  useEffect(() => {
    if (hasClickedSpin && !isAnimating) {
      spinRoulette()
    }
  }, [hasClickedSpin])

  function spinRoulette() {
    setIsAnimating(true)

    const randomSpins = Math.floor(Math.random() * 10) + 5
    const randomOffset = Math.floor(Math.random() * itemAngle)
    const finalRotation = randomSpins * 360 + randomOffset
    
    setRotation(finalRotation)

    const normalizedRotation = finalRotation % 360
    const selectedIdx = Math.floor((360 - normalizedRotation) / itemAngle) % itemsCount
    
    setSelectedIndex(selectedIdx)

    setTimeout(() => {
      setIsAnimating(false)
      onSpinComplete(selectedIdx)
    }, 3000)
  }

  function handleClickSpin() {
    setHasClickedSpin(true)
  }

  if (itemsCount === 0) {
    return null
  }

  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#B19CD9"
  ]

  return (
    <div className="roulette-overlay">
      <div className="roulette-container">
        <div className="roulette-inner">
          <div className="roulette-pointer"></div>

          <svg
            className={`roulette-wheel ${isAnimating ? "spinning" : ""}`}
            style={{ transform: `rotate(${rotation}deg)` }}
            viewBox="0 0 400 400"
            width="400"
            height="400"
          >
            {queue.map((item, index) => {
              const startAngle = (index * itemAngle - 90) * (Math.PI / 180)
              const endAngle = ((index + 1) * itemAngle - 90) * (Math.PI / 180)

              const x1 = 200 + 190 * Math.cos(startAngle)
              const y1 = 200 + 190 * Math.sin(startAngle)
              const x2 = 200 + 190 * Math.cos(endAngle)
              const y2 = 200 + 190 * Math.sin(endAngle)

              const largeArc = itemAngle > 180 ? 1 : 0

              const pathData = [
                `M 200 200`,
                `L ${x1} ${y1}`,
                `A 190 190 0 ${largeArc} 1 ${x2} ${y2}`,
                "Z"
              ].join(" ")

              const textAngle = (index + 0.5) * itemAngle - 90
              const textRadius = 130
              const textX = 200 + textRadius * Math.cos(textAngle * (Math.PI / 180))
              const textY = 200 + textRadius * Math.sin(textAngle * (Math.PI / 180))

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="white"
                    className="roulette-text"
                    style={{
                      transform: `rotate(${textAngle + 90}deg)`,
                      transformOrigin: `${textX}px ${textY}px`
                    }}
                  >
                    {item.title.substring(0, 20)}...
                  </text>
                </g>
              )
            })}

            <circle cx="200" cy="200" r="25" fill="#fff" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="15" fill="#333" />
          </svg>
        </div>

        {!hasClickedSpin && !isAnimating && (
          <button 
            onClick={handleClickSpin}
            className="roulette-spin-button"
          >
            🎡 Rodar
          </button>
        )}

        {!isAnimating && selectedIndex !== null && (
          <div className="roulette-result">
            <h2>🎉 Próximo: </h2>
            <p>{queue[selectedIndex]?.title}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Roulette

