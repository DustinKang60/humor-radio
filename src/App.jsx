import { useCallback, useEffect, useMemo, useState } from 'react'
import ChannelTabs from './components/ChannelTabs'
import EpisodeList from './components/EpisodeList'
import Player from './components/Player'
import Settings from './components/Settings'
import { DEFAULT_CHANNELS, fetchEpisodesPage } from './api/youtube'

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
  const [pageTokens, setPageTokens] = useState({})
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(() => !localStorage.getItem(API_KEY_STORAGE))
  const [activeChannelId, setActiveChannelId] = useState(null)

  const load = useCallback(async () => {
    if (!apiKey || channels.length === 0) {
      setEpisodes([])
      setPageTokens({})
      setHasMore(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { episodes, nextPageTokens, hasMore, error } = await fetchEpisodesPage(
        apiKey,
        channels,
        {},
      )
      setEpisodes(episodes)
      setPageTokens(nextPageTokens)
      setHasMore(hasMore)
      if (error) setError(error)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey, channels])

  async function loadMore() {
    if (!apiKey || loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const {
        episodes: more,
        nextPageTokens,
        hasMore: nextHasMore,
        error,
      } = await fetchEpisodesPage(apiKey, channels, pageTokens)
      setEpisodes((prev) => {
        const seen = new Set(prev.map((e) => e.id))
        const merged = [...prev, ...more.filter((e) => !seen.has(e.id))]
        merged.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        return merged
      })
      setPageTokens(nextPageTokens)
      setHasMore(nextHasMore)
      if (error) setError(error)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    localStorage.setItem(CHANNELS_STORAGE, JSON.stringify(channels))
    if (activeChannelId && !channels.some((c) => c.id === activeChannelId)) {
      setActiveChannelId(null)
    }
  }, [channels, activeChannelId])

  const visibleEpisodes = useMemo(
    () =>
      activeChannelId
        ? episodes.filter((e) => e.channelId === activeChannelId)
        : episodes,
    [episodes, activeChannelId],
  )

  function handleSaveKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key)
    setApiKey(key)
  }

  function handleResetKey() {
    localStorage.removeItem(API_KEY_STORAGE)
    setApiKey(null)
    setEpisodes([])
    setPageTokens({})
    setHasMore(false)
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
    const idx = visibleEpisodes.findIndex((e) => e.id === current.id)
    const next = visibleEpisodes[idx + offset]
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

      {apiKey && (
        <ChannelTabs
          channels={channels}
          activeId={activeChannelId}
          onSelect={setActiveChannelId}
        />
      )}

      {error && <p className="error">{error}</p>}

      <main className="app-main">
        {apiKey ? (
          <>
            <EpisodeList
              episodes={visibleEpisodes}
              currentId={current?.id}
              onSelect={setCurrent}
              showChannel={channels.length > 1 && activeChannelId === null}
            />
            {hasMore && (
              <button
                className="load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            )}
          </>
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
