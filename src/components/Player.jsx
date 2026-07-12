import { useEffect, useRef, useState } from 'react'
import { useYoutubeApi } from '../hooks/useYoutubeApi'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Player({ episode, onEnded, onNext, onPrev }) {
  const YT = useYoutubeApi()
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    if (!YT || !episode) return

    if (!playerRef.current) {
      playerRef.current = new YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: episode.id,
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            setIsPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) onEnded?.()
          },
        },
      })
    } else {
      playerRef.current.loadVideoById(episode.id)
    }
  }, [YT, episode?.id])

  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current
      if (p && typeof p.getCurrentTime === 'function') {
        setProgress({
          current: p.getCurrentTime() || 0,
          duration: p.getDuration() || 0,
        })
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  function togglePlay() {
    const p = playerRef.current
    if (!p) return
    isPlaying ? p.pauseVideo() : p.playVideo()
  }

  function seek(e) {
    const p = playerRef.current
    if (!p || !progress.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    p.seekTo(progress.duration * ratio, true)
  }

  if (!episode) return null

  const pct = progress.duration
    ? (progress.current / progress.duration) * 100
    : 0

  return (
    <div className="player">
      <div className="player-video" ref={containerRef} />
      <div className="player-info">
        <div className="player-title">{episode.title}</div>
        <div className="player-progress" onClick={seek}>
          <div className="player-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="player-time">
          <span>{formatTime(progress.current)}</span>
          <span>{formatTime(progress.duration)}</span>
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
    </div>
  )
}
