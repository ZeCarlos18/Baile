// Laço de correção: a cada 2 s compara a posição do player com a esperada
const SYNC_INTERVAL_MS = 2000
// Acima disso, pula direto para a posição certa
const SEEK_THRESHOLD_S = 0.8
// Entre isso e o seek, acerta aos poucos mudando a velocidade — mas só se o
// vídeo oferecer taxas próximas de 1 (ex.: 0,95/1,05). Com 0,75/1,25 a
// música fica claramente mais lenta/rápida, então nesse caso só usa seek.
const RATE_THRESHOLD_S = 0.15
const MAX_RATE_DEVIATION = 0.1
// Tempo sem tocar (quando deveria) até considerar o áudio bloqueado
const BLOCKED_AFTER_MS = 3000

// Valores de YT.PlayerState
const ENDED = 0
const PLAYING = 1
const BUFFERING = 3

let apiPromise = null

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.body.appendChild(tag)
    })
  }

  return apiPromise
}

/**
 * Player do YouTube que segue o `nowPlaying` do servidor.
 *
 * É criado uma vez e troca de música com `loadVideoById`. A posição
 * esperada é `(serverNow() - startAt) / 1000`; se for negativa (a música
 * ainda vai começar), espera até lá.
 *
 * O elemento do iframe é criado aqui dentro de `container`, fora do
 * controle do React, porque a API do YouTube substitui o elemento que
 * recebe.
 */
export class SyncedPlayer {
  constructor(container, { serverNow, onEnded, onError, onBlocked, onPlaying }) {
    this.container = container
    this.callbacks = { serverNow, onEnded, onError, onBlocked, onPlaying }

    this.player = null
    this.ready = false
    this.destroyed = false
    this.nowPlaying = null
    this.shouldPlay = false
    this.notPlayingSince = null
    this.reportedEntryId = null
    this.startTimer = null

    const host = document.createElement("div")
    container.appendChild(host)

    loadYouTubeApi().then((YT) => {
      if (this.destroyed) return
      this.player = new YT.Player(host, {
        height: "390",
        width: "640",
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            this.ready = true
            this.apply()
          },
          onStateChange: (event) => this.handleStateChange(event.data),
          onError: (event) => this.handleError(event.data)
        }
      })
    })

    this.syncLoop = setInterval(() => this.tick(), SYNC_INTERVAL_MS)
  }

  /** Recebe o `nowPlaying` do servidor ({ entry, startAt } ou null). */
  setNowPlaying(nowPlaying) {
    const current = this.nowPlaying
    const same =
      nowPlaying != null &&
      current != null &&
      nowPlaying.entry.entryId === current.entry.entryId &&
      nowPlaying.startAt === current.startAt

    this.nowPlaying = nowPlaying
    if (!same) this.apply()
  }

  /** Chamado a partir de um gesto do usuário para liberar o áudio. */
  resume() {
    this.play()
  }

  destroy() {
    this.destroyed = true
    clearInterval(this.syncLoop)
    clearTimeout(this.startTimer)
    this.player?.destroy()
    this.player = null
    this.container.replaceChildren()
  }

  // --- Interno ------------------------------------------------------------

  expectedSeconds() {
    return (this.callbacks.serverNow() - this.nowPlaying.startAt) / 1000
  }

  // Carrega a música atual na posição em que ela deveria estar
  apply() {
    if (!this.ready) return

    clearTimeout(this.startTimer)
    this.notPlayingSince = null

    const nowPlaying = this.nowPlaying
    if (!nowPlaying) {
      this.shouldPlay = false
      this.player.stopVideo()
      return
    }

    const { videoId } = nowPlaying.entry
    const expected = this.expectedSeconds()

    if (expected < 0) {
      // Ainda não começou: deixa carregado e dá play na hora combinada
      this.shouldPlay = false
      this.player.cueVideoById({ videoId, startSeconds: 0 })
      this.startTimer = setTimeout(() => this.play(), -expected * 1000)
    } else {
      this.shouldPlay = true
      this.player.loadVideoById({ videoId, startSeconds: expected })
    }
  }

  play() {
    if (!this.ready || !this.nowPlaying) return

    const expected = this.expectedSeconds()
    if (expected < 0) return

    if (Math.abs(this.player.getCurrentTime() - expected) > SEEK_THRESHOLD_S) {
      this.player.seekTo(expected, true)
    }
    this.shouldPlay = true
    this.player.playVideo()
  }

  tick() {
    if (!this.ready || !this.nowPlaying || !this.shouldPlay) return

    const state = this.player.getPlayerState()

    if (state === PLAYING) {
      this.notPlayingSince = null
      this.correctDrift()
      return
    }
    if (state === BUFFERING || state === ENDED) return

    // Deveria estar tocando e não está (autoplay bloqueado ou pausado)
    this.notPlayingSince ??= Date.now()
    if (Date.now() - this.notPlayingSince >= BLOCKED_AFTER_MS) {
      this.callbacks.onBlocked?.()
    }
  }

  correctDrift() {
    const expected = this.expectedSeconds()
    const duration = this.player.getDuration()
    if (duration > 0 && expected >= duration) return

    // Positivo: este aparelho está adiantado
    const drift = this.player.getCurrentTime() - expected

    if (Math.abs(drift) > SEEK_THRESHOLD_S) {
      this.setRate(1)
      this.player.seekTo(expected, true)
      return
    }

    const { slower, faster } = this.fineRates()
    if (Math.abs(drift) > RATE_THRESHOLD_S && slower && faster) {
      this.setRate(drift > 0 ? slower : faster)
    } else {
      this.setRate(1)
    }
  }

  // Taxas disponíveis próximas de 1 (ex.: 0,95 e 1,05), se existirem
  fineRates() {
    const rates = this.player.getAvailablePlaybackRates?.() ?? []
    const near = rates.filter(r => Math.abs(r - 1) <= MAX_RATE_DEVIATION)
    const below = near.filter(r => r < 1)
    const above = near.filter(r => r > 1)
    return {
      slower: below.length ? Math.max(...below) : null,
      faster: above.length ? Math.min(...above) : null
    }
  }

  setRate(rate) {
    if (this.player.getPlaybackRate() !== rate) this.player.setPlaybackRate(rate)
  }

  handleStateChange(state) {
    if (state === PLAYING) {
      this.notPlayingSince = null
      this.callbacks.onPlaying?.()
    } else if (state === ENDED) {
      this.shouldPlay = false
      this.report(entryId => this.callbacks.onEnded?.(entryId))
    }
  }

  // 2: parâmetro inválido · 5: erro no player HTML5 · 100: vídeo removido ou
  // privado · 101/150: o dono não permite incorporar
  handleError(code) {
    this.shouldPlay = false
    this.report(entryId => this.callbacks.onError?.(entryId, code))
  }

  // Fim e erro são avisados no máximo uma vez por música
  report(send) {
    const entryId = this.nowPlaying?.entry.entryId
    if (!entryId || this.reportedEntryId === entryId) return
    this.reportedEntryId = entryId
    send(entryId)
  }
}
