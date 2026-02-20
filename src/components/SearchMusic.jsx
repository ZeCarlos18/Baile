import { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/SearchMusic.css'

function SearchMusic({ socket, roomId }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer)

    const timer = setTimeout(() => {
      if (search.trim()) {
        searchTracks(search)
      } else {
        setResults([])
      }
    }, 500)

    setDebounceTimer(timer)

    return () => clearTimeout(timer)
  }, [search])

  const searchTracks = async (query) => {
    setLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/spotify/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setResults(response.data.tracks.items || [])
    } catch (error) {
      console.error('Erro ao buscar músicas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToQueue = (track) => {
    socket?.emit('add_to_queue', {
      roomId,
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        uri: track.uri,
        duration_ms: track.duration_ms,
      }
    })
    setSearch('')
    setResults([])
  }

  return (
    <div className="search-music">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="🔍 Pesquise uma música..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {loading && <span className="loading">Carregando...</span>}
      </div>

      {results.length > 0 && (
        <div className="search-results">
          {results.slice(0, 8).map((track) => (
            <div 
              key={track.id} 
              className="search-result-item"
              onClick={() => handleAddToQueue(track)}
            >
              <img 
                src={track.album?.images?.[2]?.url}
                alt={track.name}
                onError={(e) => e.target.src = '/placeholder-album.png'}
              />
              <div className="result-info">
                <p className="result-name">{track.name}</p>
                <p className="result-artist">
                  {track.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
              <span className="add-btn">➕</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchMusic