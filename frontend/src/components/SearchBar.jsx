import React, { useState } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'

const SAMPLE_CITIES = [
  'New York City, USA',
  'Tokyo, Japan',
  'Mumbai, India',
  'London, UK',
  'Sydney, Australia',
  'Singapore',
  'Dubai, UAE',
  'São Paulo, Brazil'
]

function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleSuggestion = (city) => {
    setQuery(city)
    onSearch(city)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search city or coordinates..."
            className="input-field pl-10 pr-12"
            disabled={isLoading}
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 animate-spin" />
          ) : (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              disabled={!query.trim()}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 card overflow-hidden z-50">
          <div className="p-2">
            <p className="text-xs text-dark-400 px-3 py-2 uppercase tracking-wider">
              Sample Cities
            </p>
            {SAMPLE_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleSuggestion(city)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-dark-700 rounded-lg transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-dark-400" />
                <span className="text-sm">{city}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronRight(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export default SearchBar