import { useEffect, useRef, useState } from 'react'
import { AUDIO_PROXY_URL } from '../config'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Player({ episode, onEnded, onNext, onPrev }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !episode) return
    setLoadError(null)
    audio.src = `${AUDIO_PROXY_URL}/audio/${episode.id}`
    audio.play().catch(() => {})
  }, [episode?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () =>
      setProgress({ current: audio.currentTime, duration: audio.duration || 0 })
    const onEndedEvt = () => onEnded?.()
    const onError = () => setLoadError('오디오를 불러오지 못했어요.')

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onTimeUpdate)
    audio.addEventListener('ended', onEndedEvt)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onTimeUpdate)
      audio.removeEventListener('ended', onEndedEvt)
      audio.removeEventListener('error', onError)
    }
  }, [onEnded])

  // Media Session: lock-screen / notification controls, and what lets
  // playback survive switching to another app in the background.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !episode) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: episode.channelTitle || '유튜브 라디오',
      artwork: episode.thumbnail
        ? [{ src: episode.thumbnail, sizes: '320x180', type: 'image/jpeg' }]
        : [],
    })
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play())
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => onPrev?.())
    navigator.mediaSession.setActionHandler('nexttrack', () => onNext?.())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime
      }
    })
  }, [episode, onPrev, onNext])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play().catch(() => {})
  }

  function seek(e) {
    const audio = audioRef.current
    if (!audio || !progress.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = progress.duration * ratio
  }

  if (!episode) return null

  const pct = progress.duration
    ? (progress.current / progress.duration) * 100
    : 0

  return (
    <div className="player">
      <audio ref={audioRef} preload="metadata" />
      <div className="player-art">
        {episode.thumbnail && <img src={episode.thumbnail} alt="" />}
      </div>
      <div className="player-info">
        <div className="player-title">{episode.title}</div>
        {loadError && <div className="player-error">{loadError}</div>}
        <div className="player-progress" onClick={seek}>
          <div className="player-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="player-time">
          <span>{formatTime(progress.current)}</span>
          <span>{formatTime(progress.duration)}</span>
        </div>
      </div>
      <div className="player-controls">
        <button onClick={onPrev} aria-label="이전 화">
          ⏮
        </button>
        <button onClick={togglePlay} aria-label={isPlaying ? '일시정지' : '재생'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={onNext} aria-label="다음 화">
          ⏭
        </button>
      </div>
    </div>
  )
}
