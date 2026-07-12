function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export default function EpisodeList({ episodes, currentId, onSelect, showChannel }) {
  if (episodes.length === 0) {
    return <p className="empty">에피소드가 없습니다.</p>
  }

  return (
    <ul className="episode-list">
      {episodes.map((ep) => (
        <li
          key={ep.id}
          className={ep.id === currentId ? 'episode active' : 'episode'}
          onClick={() => onSelect(ep)}
        >
          <img src={ep.thumbnail} alt="" loading="lazy" className="episode-thumb" />
          <div className="episode-meta">
            <div className="episode-title">{ep.title}</div>
            <div className="episode-sub">
              {showChannel && (
                <span className="episode-channel">{ep.channelTitle}</span>
              )}
              <span className="episode-date">{formatDate(ep.publishedAt)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
