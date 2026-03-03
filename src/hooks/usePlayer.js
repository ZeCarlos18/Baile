import { useEffect, useRef } from "react"

let apiLoaded = false

export function usePlayer(videoId, onVideoEnd, startTime = 0, onPlayStateChange) {
  const playerRef = useRef(null)

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
                if (startTime && startTime > 0) {
                  event.target.seekTo(startTime)
                }
                event.target.playVideo()
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  console.log("Playing")
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  console.log("Paused")
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  if (onVideoEnd) {
                    onVideoEnd()
                  }
                }
              }
            }
          })
        } else {
          playerRef.current.cueVideoById(videoId)
          if (startTime && startTime > 0) {
            playerRef.current.seekTo(startTime)
          }
          playerRef.current.playVideo()
        }
      } catch (error) {
        console.error("Error initializing player:", error)
      }
    }

    return () => {
      clearInterval(waitForApi)
    }
  }, [videoId, onVideoEnd, startTime, onPlayStateChange])

  return playerRef
}
