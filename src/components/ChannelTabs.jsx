export default function ChannelTabs({ channels, activeId, onSelect }) {
  if (channels.length < 2) return null

  return (
    <div className="channel-tabs">
      <button
        className={activeId === null ? 'channel-tab active' : 'channel-tab'}
        onClick={() => onSelect(null)}
      >
        전체
      </button>
      {channels.map((c) => (
        <button
          key={c.id}
          className={activeId === c.id ? 'channel-tab active' : 'channel-tab'}
          onClick={() => onSelect(c.id)}
        >
          {c.thumbnail && <img src={c.thumbnail} alt="" />}
          <span>{c.title}</span>
        </button>
      ))}
    </div>
  )
}
