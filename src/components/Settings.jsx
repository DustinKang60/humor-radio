import { useState } from 'react'
import { resolveChannel } from '../api/youtube'

export default function Settings({
  apiKey,
  channels,
  onAddChannel,
  onRemoveChannel,
  onResetKey,
  onClose,
}) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const channel = await resolveChannel(apiKey, input)
      onAddChannel(channel)
      setInput('')
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const maskedKey = apiKey ? `${apiKey.slice(0, 6)}${'•'.repeat(10)}` : ''

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>설정</h2>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </div>

        <section className="settings-section">
          <h3>채널 관리</h3>
          <ul className="channel-list">
            {channels.map((c) => (
              <li key={c.id} className="channel-row">
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt="" className="channel-thumb" />
                ) : (
                  <div className="channel-thumb placeholder" />
                )}
                <span className="channel-title">{c.title}</span>
                <button
                  className="text-button danger"
                  onClick={() => onRemoveChannel(c.id)}
                >
                  삭제
                </button>
              </li>
            ))}
            {channels.length === 0 && (
              <li className="channel-empty">등록된 채널이 없습니다.</li>
            )}
          </ul>

          <form className="channel-add-form" onSubmit={handleAdd}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="채널 URL 또는 @핸들 입력"
              autoComplete="off"
              spellCheck="false"
            />
            <button type="submit" disabled={adding}>
              {adding ? '추가 중...' : '추가'}
            </button>
          </form>
          {addError && <p className="error small">{addError}</p>}
        </section>

        <section className="settings-section">
          <h3>API 키</h3>
          <div className="api-key-row">
            <span className="api-key-masked">{maskedKey}</span>
            <button className="text-button" onClick={onResetKey}>
              변경
            </button>
          </div>
        </section>

        <footer className="sheet-footer">
          <span>작은앱공방</span>
        </footer>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
