const CHANNEL_ID = 'UCRstLhO5i-Qg5W0VFefuKSw'
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2)

export async function fetchLatestEpisodes(apiKey, { pageToken } = {}) {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('playlistId', UPLOADS_PLAYLIST_ID)
  url.searchParams.set('maxResults', '25')
  url.searchParams.set('key', apiKey)
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.error?.message || `요청 실패 (${res.status})`
    throw new Error(message)
  }
  const data = await res.json()

  const episodes = data.items.map((item) => ({
    id: item.contentDetails.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.contentDetails.videoPublishedAt,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url,
  }))

  return { episodes, nextPageToken: data.nextPageToken || null }
}
