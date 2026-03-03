import { useEffect, useRef } from "react"

let apiLoaded = false

export function usePlayer(videoId, onVideoEnd, startTime = 0, onPlayStateChange) {
  const playerRef = useRef(null)
  const lastPlayPauseEmitRef = useRef({ state: null, time: 0 }) // Rastrear último play/pause emitido

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
                const currentState = event.data === window.YT.PlayerState.PLAYING ? 'play' : 
                                   event.data === window.YT.PlayerState.PAUSED ? 'pause' : null
                
                if (currentState === 'play') {
                  console.log("▶️ Vídeo tocando")
                  const now = Date.now()
                  // Só emitir se o último play foi há mais de 300ms
                  if (lastPlayPauseEmitRef.current.state !== 'play' || (now - lastPlayPauseEmitRef.current.time) > 300) {
                    console.log("📤 Emitindo play para servidor")
                    if (onPlayStateChange) {
                      onPlayStateChange('play', event.target.getCurrentTime())
                    }
                    lastPlayPauseEmitRef.current = { state: 'play', time: now }
                  } else {
                    console.log("⏭️ Ignorando play (cooldown ativo)")
                  }
                } else if (currentState === 'pause') {
                  console.log("⏸️ Vídeo pausado")
                  const now = Date.now()
                  // Só emitir se o último pause foi há mais de 300ms
                  if (lastPlayPauseEmitRef.current.state !== 'pause' || (now - lastPlayPauseEmitRef.current.time) > 300) {
                    console.log("📤 Emitindo pause para servidor")
                    if (onPlayStateChange) {
                      onPlayStateChange('pause', event.target.getCurrentTime())
                    }
                    lastPlayPauseEmitRef.current = { state: 'pause', time: now }
                  } else {
                    console.log("⏭️ Ignorando pause (cooldown ativo)")
                  }
                } else if (event.data === window.YT.PlayerState.ENDED) {
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
  }, [videoId, onVideoEnd, startTime, onPlayStateChange])

  return playerRef
}
