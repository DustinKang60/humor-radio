import { useState } from 'react'
import { resolveChannel } from '../api/youtube'

export default function Settings({
  apiKey,
  channels,
  onAddChannel,
  onRemoveChannel,
  onSaveKey,
  onResetKey,
  onClose,
}) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [keyInput, setKeyInput] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!input.trim()) return
    if (!apiKey) {
      setAddError('먼저 아래에서 API 키를 입력해주세요.')
      return
    }
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

  function handleSaveKey(e) {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return
    onSaveKey(trimmed)
    setKeyInput('')
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
          <h3>API 키</h3>
          {apiKey ? (
            <div className="api-key-row">
              <span className="api-key-masked">{maskedKey}</span>
              <button className="text-button danger" onClick={onResetKey}>
                삭제
              </button>
            </div>
          ) : (
            <>
              <p className="settings-hint">
                채널의 최신 영상을 불러오려면 유튜브 Data API 키가 필요해요.
              </p>
              <ol className="setup-steps compact">
                <li>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Cloud Console
                  </a>
                  에서 프로젝트를 만들고 &quot;YouTube Data API v3&quot;를 사용
                  설정합니다.
                </li>
                <li>사용자 인증 정보에서 API 키를 발급받습니다.</li>
              </ol>
              <form className="channel-add-form" onSubmit={handleSaveKey}>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="YouTube Data API 키 붙여넣기"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button type="submit">저장</button>
              </form>
            </>
          )}
        </section>

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
