import { useEffect } from "react"

function Player({ videoId }) {
  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.body.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player("player", {
        height: "390",
        width: "640",
        videoId,
        events: {
          onReady: (event) => event.target.playVideo()
        }
      })
    }
  }, [videoId])

  return <div id="player"></div>
}

export default Player