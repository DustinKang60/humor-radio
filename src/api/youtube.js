export const DEFAULT_CHANNELS = [
  {
    id: 'UCRstLhO5i-Qg5W0VFefuKSw',
    title: '하이파이브 : LA 최고 예능라디오',
    thumbnail: '',
  },
]

function apiUrl(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.error?.message || `요청 실패 (${res.status})`
    throw new Error(message)
  }
  return res.json()
}

export function parseChannelInput(input) {
  const trimmed = input.trim()
  if (!trimmed) return null

  const handleMatch = trimmed.match(/(?:youtube\.com\/)?@([\w.-]+)/i)
  if (handleMatch) return { type: 'handle', value: '@' + handleMatch[1] }

  const channelIdMatch = trimmed.match(/(?:youtube\.com\/channel\/)?(UC[\w-]{22})/i)
  if (channelIdMatch) return { type: 'id', value: channelIdMatch[1] }

  if (trimmed.startsWith('@')) return { type: 'handle', value: trimmed }

  return { type: 'handle', value: '@' + trimmed }
}

export async function resolveChannel(apiKey, input) {
  const parsed = parseChannelInput(input)
  if (!parsed) throw new Error('채널 정보를 입력해주세요.')

  const params =
    parsed.type === 'handle'
      ? { forHandle: parsed.value }
      : { id: parsed.value }

  const data = await getJson(
    apiUrl('channels', { part: 'snippet', key: apiKey, ...params }),
  )

  const item = data.items?.[0]
  if (!item) throw new Error('채널을 찾을 수 없습니다. 주소나 핸들을 확인해주세요.')

  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.default?.url ||
      item.snippet.thumbnails?.medium?.url ||
      '',
  }
}

async function fetchChannelEpisodes(apiKey, channel) {
  const uploadsPlaylistId = 'UU' + channel.id.slice(2)
  const data = await getJson(
    apiUrl('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '15',
      key: apiKey,
    }),
  )

  return (data.items || []).map((item) => ({
    id: item.contentDetails.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.contentDetails.videoPublishedAt,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url,
    channelId: channel.id,
    channelTitle: channel.title,
  }))
}

export async function fetchLatestEpisodes(apiKey, channels) {
  const results = await Promise.allSettled(
    channels.map((channel) => fetchChannelEpisodes(apiKey, channel)),
  )

  const episodes = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  const failed = results.filter((r) => r.status === 'rejected')
  const error =
    failed.length > 0 && episodes.length === 0
      ? failed[0].reason?.message || '에피소드를 불러오지 못했습니다.'
      : null

  return { episodes, error }
}
