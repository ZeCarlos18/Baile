import { useState } from "react"

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("")

  return (
    <div>
      <input
        placeholder="Buscar música"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={() => onSearch(query)}>Buscar</button>
    </div>
  )
}

export default SearchBar