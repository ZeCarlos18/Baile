import { useEffect, useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import '../styles/Login.css'

function Login() {
  const [searchParams] = useSearchParams()
  const { loginWithSpotify, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()

  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      loginWithSpotify(code)
        .then(() => navigate('/dashboard'))
        .catch(() => {})
    }
  }, [searchParams, loginWithSpotify, navigate])

  const handleSpotifyLogin = () => {
    const scope = 'user-read-private user-read-email user-read-currently-playing user-modify-playback-state streaming'
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`
    window.location.href = authUrl
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🎵 Baile da Gaiola</h1>
          <p>Escute músicas em sincronismo com seus amigos</p>
        </div>

        <div className="login-content">
          <div className="spotify-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.376-.645.664-1.071.864-.426.2-.9.311-1.377.311-.528 0-1.04-.083-1.522-.25-.482-.167-.912-.407-1.278-.721-.366-.315-.655-.72-.86-1.2-.206-.483-.31-.982-.31-1.494 0-.512.104-1.011.31-1.494.205-.483.494-.887.86-1.2.366-.314.796-.554 1.278-.721.482-.167.994-.25 1.522-.25.477 0 .951.111 1.377.311.426.2.831.488 1.071.864.24.376.361.825.361 1.303 0 .478-.121.927-.361 1.303zm-7.042-10.07c-.2.314-.535.555-.88.697-.345.142-.72.213-1.095.213-.375 0-.75-.071-1.095-.213-.345-.142-.68-.383-.88-.697-.2-.314-.301-.7-.301-1.086 0-.386.101-.772.301-1.086.2-.314.535-.555.88-.697.345-.142.72-.213 1.095-.213.375 0 .75.071 1.095.213.345.142.68.383.88.697.2.314.301.7.301 1.086 0 .386-.101.772-.301 1.086z"/>
            </svg>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="spotify-login-btn" 
            onClick={handleSpotifyLogin}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Entrar com Spotify'}
          </button>

          <div className="login-info">
            <h3>Como funciona:</h3>
            <ul>
              <li>✨ Usuários Premium podem criar salas</li>
              <li>👥 Convide amigos para entrar na sua sala</li>
              <li>🎵 Pesquise e adicione músicas à fila</li>
              <li>🎰 Votação para próxima música</li>
              <li>🔄 Sincronismo em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login