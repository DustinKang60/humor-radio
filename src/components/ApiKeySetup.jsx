import { useState } from 'react'

export default function ApiKeySetup({ onSave }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div className="setup">
      <h1>유머 라디오</h1>
      <p>
        라디오 하이파이브 채널의 최신 영상을 팟캐스트처럼 듣기 위해
        유튜브 Data API 키가 필요해요.
      </p>
      <ol className="setup-steps">
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
        <li>아래에 키를 붙여넣으면 이 브라우저에만 저장됩니다.</li>
      </ol>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="YouTube Data API 키 붙여넣기"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit">저장하고 시작하기</button>
      </form>
    </div>
  )
}
