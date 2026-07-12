import express from 'express'
import cors from 'cors'
import { execFile } from 'node:child_process'

const app = express()
const PORT = process.env.PORT || 8787
const ALLOWED_ORIGIN = 'https://dustinkang60.github.io'

// videoId -> { url, expiresAt }
const urlCache = new Map()
const CACHE_MARGIN_MS = 5 * 60 * 1000 // refresh 5 min before actual expiry
const DEFAULT_TTL_MS = 30 * 60 * 1000

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (origin === ALLOWED_ORIGIN) return callback(null, true)
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true)
      callback(new Error('Not allowed by CORS'))
    },
    exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
  }),
)

app.get('/', (req, res) => {
  res.send('humor-radio audio proxy')
})

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

function resolveAudioUrl(videoId) {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      ['-f', 'bestaudio', '-g', '--no-update', videoId],
      { timeout: 20000 },
      (err, stdout) => {
        if (err) return reject(err)
        const url = stdout.trim().split('\n')[0]
        if (!url) return reject(new Error('empty url from yt-dlp'))
        resolve(url)
      },
    )
  })
}

function expiryFromUrl(url) {
  try {
    const expire = new URL(url).searchParams.get('expire')
    if (!expire) return Date.now() + DEFAULT_TTL_MS
    return Number(expire) * 1000 - CACHE_MARGIN_MS
  } catch {
    return Date.now() + DEFAULT_TTL_MS
  }
}

async function getAudioUrl(videoId) {
  const cached = urlCache.get(videoId)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const url = await resolveAudioUrl(videoId)
  urlCache.set(videoId, { url, expiresAt: expiryFromUrl(url) })
  return url
}

app.get('/audio/:id', async (req, res) => {
  const { id } = req.params
  if (!/^[\w-]{11}$/.test(id)) {
    return res.status(400).send('invalid video id')
  }

  try {
    const audioUrl = await getAudioUrl(id)
    const upstream = await fetch(audioUrl, {
      headers: req.headers.range ? { Range: req.headers.range } : {},
    })

    if (!upstream.ok && upstream.status !== 206) {
      urlCache.delete(id)
      return res.status(502).send('upstream fetch failed')
    }

    res.status(upstream.status)
    for (const key of [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ]) {
      const value = upstream.headers.get(key)
      if (value) res.setHeader(key, value)
    }
    res.setHeader('Cache-Control', 'no-store')

    const reader = upstream.body.getReader()
    req.on('close', () => reader.cancel().catch(() => {}))
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!res.write(value)) {
        await new Promise((resolve) => res.once('drain', resolve))
      }
    }
    res.end()
  } catch (err) {
    console.error('audio proxy error', err.message)
    urlCache.delete(id)
    if (!res.headersSent) res.status(500).send('failed to load audio')
  }
})

app.listen(PORT, () => {
  console.log(`audio proxy listening on :${PORT}`)
})
