import { useEffect, useRef } from "react"

let apiLoaded = false

export function usePlayer(videoId, onVideoEnd, startTime = 0) {
  const playerRef = useRef(null)

  useEffect(() => {
    // Carregar YouTube API apenas uma vez
    if (!apiLoaded) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.body.appendChild(tag)
      apiLoaded = true
    }

    // Aguardar API estar pronta
    const waitForApi = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(waitForApi)
        initializePlayer()
      }
    }, 100)

    function initializePlayer() {
      try {
        if (!playerRef.current) {
          playerRef.current = new window.YT.Player("player", {
            height: "390",
            width: "640",
            videoId: videoId,
            events: {
              onReady: (event) => {
                console.log("▶️ Player pronto, tocando:", videoId)
                // Se houver tempo decorrido, pular para esse tempo
                if (startTime && startTime > 0) {
                  console.log(`⏩ Pulando para ${startTime}s`)
                  event.target.seekTo(startTime)
                }
                event.target.playVideo()
              },
              onStateChange: (event) => {
                // 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 5 = CUED
                if (event.data === window.YT.PlayerState.ENDED) {
                  console.log("⏹️ Vídeo terminou")
                  if (onVideoEnd) {
                    onVideoEnd()
                  }
                }
              }
            }
          })
        } else {
          // Se player já existe, apenas troca o vídeo
          console.log("🔄 Trocando vídeo para:", videoId)
          playerRef.current.cueVideoById(videoId)
          // Pular para o tempo correto
          if (startTime && startTime > 0) {
            console.log(`⏩ Pulando para ${startTime}s`)
            playerRef.current.seekTo(startTime)
          }
          playerRef.current.playVideo()
        }
      } catch (error) {
        console.error("❌ Erro ao inicializar player:", error)
      }
    }

    return () => {
      clearInterval(waitForApi)
    }
  }, [videoId, onVideoEnd, startTime])

  return playerRef
}
