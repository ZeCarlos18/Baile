import { useEffect, useRef } from "react"

let apiLoaded = false

// Posição em que a música deveria estar agora, a partir do startAt do servidor
function secondsSince(startAt) {
  return Math.max(0, (Date.now() - startAt) / 1000)
}

/**
 * `playKey` identifica a execução (entryId): a mesma música tocada duas
 * vezes seguidas também recarrega. `onVideoEnd` e `startAt` ficam em refs
 * para que re-renders da sala não reiniciem a música.
 */
export function usePlayer({ videoId, playKey, startAt, onVideoEnd }) {
  const playerRef = useRef(null)
  const onVideoEndRef = useRef(onVideoEnd)
  const startAtRef = useRef(startAt)

  useEffect(() => {
    onVideoEndRef.current = onVideoEnd
    startAtRef.current = startAt
  })

  useEffect(() => {
    if (!apiLoaded) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.body.appendChild(tag)
      apiLoaded = true
    }

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
                const startSeconds = secondsSince(startAtRef.current)
                if (startSeconds > 0) {
                  event.target.seekTo(startSeconds, true)
                }
                event.target.playVideo()
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  onVideoEndRef.current?.()
                }
              }
            }
          })
        } else {
          playerRef.current.loadVideoById({
            videoId,
            startSeconds: secondsSince(startAtRef.current)
          })
        }
      } catch (error) {
        console.error("Error initializing player:", error)
      }
    }

    return () => {
      clearInterval(waitForApi)
    }
  }, [videoId, playKey])

  return playerRef
}
