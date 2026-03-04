import { useState } from "react"

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("")

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="search-bar-container">
      <input
        className="search-input"
        placeholder="Digite o nome da música..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button 
        className="search-btn"
        onClick={handleSearch}
      >
        🔍 Buscar
      </button>
    </div>
  )
}

export default SearchBar