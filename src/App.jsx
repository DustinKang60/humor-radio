import { useCallback, useEffect, useState } from 'react'
import ApiKeySetup from './components/ApiKeySetup'
import EpisodeList from './components/EpisodeList'
import Player from './components/Player'
import { fetchLatestEpisodes } from './api/youtube'

const STORAGE_KEY = 'humor-radio-api-key'

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(null)

  const load = useCallback(async () => {
    if (!apiKey) return
    setLoading(true)
    setError(null)
    try {
      const { episodes } = await fetchLatestEpisodes(apiKey)
      setEpisodes(episodes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    load()
  }, [load])

  function handleSaveKey(key) {
    localStorage.setItem(STORAGE_KEY, key)
    setApiKey(key)
  }

  function handleResetKey() {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey(null)
    setEpisodes([])
    setCurrent(null)
  }

  function playByOffset(offset) {
    if (!current) return
    const idx = episodes.findIndex((e) => e.id === current.id)
    const next = episodes[idx + offset]
    if (next) setCurrent(next)
  }

  if (!apiKey) {
    return <ApiKeySetup onSave={handleSaveKey} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>유머 라디오</h1>
        <div className="app-header-actions">
          <button onClick={load} disabled={loading}>
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
          <button onClick={handleResetKey} className="ghost">
            API 키 변경
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <main className="app-main">
        <EpisodeList
          episodes={episodes}
          currentId={current?.id}
          onSelect={setCurrent}
        />
      </main>

      {current && (
        <Player
          episode={current}
          onEnded={() => playByOffset(1)}
          onNext={() => playByOffset(1)}
          onPrev={() => playByOffset(-1)}
        />
      )}
    </div>
  )
}
