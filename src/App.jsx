import { useCallback, useEffect, useState } from 'react'
import EpisodeList from './components/EpisodeList'
import Player from './components/Player'
import Settings from './components/Settings'
import { DEFAULT_CHANNELS, fetchLatestEpisodes } from './api/youtube'

const API_KEY_STORAGE = 'humor-radio-api-key'
const CHANNELS_STORAGE = 'humor-radio-channels'

function loadChannels() {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE)
    if (!raw) return DEFAULT_CHANNELS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CHANNELS
  } catch {
    return DEFAULT_CHANNELS
  }
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE))
  const [channels, setChannels] = useState(loadChannels)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(() => !localStorage.getItem(API_KEY_STORAGE))

  const load = useCallback(async () => {
    if (!apiKey || channels.length === 0) {
      setEpisodes([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { episodes, error } = await fetchLatestEpisodes(apiKey, channels)
      setEpisodes(episodes)
      if (error) setError(error)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey, channels])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    localStorage.setItem(CHANNELS_STORAGE, JSON.stringify(channels))
  }, [channels])

  function handleSaveKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key)
    setApiKey(key)
  }

  function handleResetKey() {
    localStorage.removeItem(API_KEY_STORAGE)
    setApiKey(null)
    setEpisodes([])
    setCurrent(null)
  }

  function addChannel(channel) {
    setChannels((prev) =>
      prev.some((c) => c.id === channel.id) ? prev : [...prev, channel],
    )
  }

  function removeChannel(id) {
    setChannels((prev) => prev.filter((c) => c.id !== id))
  }

  function playByOffset(offset) {
    if (!current) return
    const idx = episodes.findIndex((e) => e.id === current.id)
    const next = episodes[idx + offset]
    if (next) setCurrent(next)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt=""
            className="app-logo"
          />
          <h1>유튜브 라디오</h1>
        </div>
        <div className="app-header-actions">
          <button onClick={load} disabled={loading} className="icon-button" aria-label="새로고침">
            <RefreshIcon spinning={loading} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="icon-button"
            aria-label="설정"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <main className="app-main">
        {apiKey ? (
          <EpisodeList
            episodes={episodes}
            currentId={current?.id}
            onSelect={setCurrent}
            showChannel={channels.length > 1}
          />
        ) : (
          <div className="key-prompt">
            <p>유튜브 API 키를 설정에서 입력하면 최신 영상을 불러올 수 있어요.</p>
            <button onClick={() => setSettingsOpen(true)}>설정 열기</button>
          </div>
        )}
      </main>

      {current && (
        <Player
          episode={current}
          onEnded={() => playByOffset(1)}
          onNext={() => playByOffset(1)}
          onPrev={() => playByOffset(-1)}
        />
      )}

      {settingsOpen && (
        <Settings
          apiKey={apiKey}
          channels={channels}
          onAddChannel={addChannel}
          onRemoveChannel={removeChannel}
          onSaveKey={handleSaveKey}
          onResetKey={handleResetKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      className={spinning ? 'spin' : ''}
    >
      <path
        d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1L15 3h-6l-.3 2.9a8 8 0 0 0-1.7 1l-2.5-1-2 3.4L4.6 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1L9 21h6l.3-2.9a8 8 0 0 0 1.7-1l2.5 1 2-3.4L19.4 13Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
