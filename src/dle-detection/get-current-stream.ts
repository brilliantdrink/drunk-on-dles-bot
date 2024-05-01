// https://github.com/acerbisgianluca/node-twitch-get-stream/blob/hotfix/twitch-auth-endpoint/index.js

import qs from 'querystring'
import parseM3U from './parse-m3u.js'
import {getFailedFetchesTimestamps} from './fetch-frame.js'

export const clientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko'

type AccessToken = {
  value: string,
  signature: string,
  authorization: {
    isForbidden: boolean,
    forbiddenReasonCode: string
  },
  __typename: 'PlaybackAccessToken'
}

function getAccessToken(channel: string) {
  let capturedResponse: Response
  const headers: HeadersInit = {
    'Client-ID': clientId,
    referer: 'https://www.twitch.tv',
    origin: 'https://www.twitch.tv',
  }
  if (process.env.TWITCH_AUTH_TOKEN) headers.Authorization = `OAuth ${process.env.TWITCH_AUTH_TOKEN}`
  return fetch('https://gql.twitch.tv/gql', {
    method: 'post',
    body: JSON.stringify({
      operationName: 'PlaybackAccessToken',
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712',
        },
      },
      variables: {
        isLive: true,
        login: channel,
        isVod: false,
        vodID: '',
        playerType: 'site',
      },
    }),
    headers,
  })
    .then(res => {
      capturedResponse = res.clone()
      return res
    })
    .then(res => res.json() as Promise<{ data: { streamPlaybackAccessToken: AccessToken } }>)
    .then(gqlRes => gqlRes.data.streamPlaybackAccessToken)
    .catch(error => {
      console.debug(capturedResponse)
      capturedResponse.text().then(console.debug)
      throw error
    })
}

function getPlaylist(channel: string, accessToken: AccessToken) {
  const query = {
    platform: 'web',
    token: accessToken.value,
    sig: accessToken.signature,
    fast_bread: true,
    allow_source: 'true',
    type: 'any',
    p: Math.floor(Math.random() * 99999) + 1,
    supported_codecs: 'h265,h264'
  }

  let capturedResponse: Response
  return fetch(`https://usher.ttvnw.net/api/channel/hls/${channel}.m3u8?${qs.stringify(query)}`, {
    headers: {
      'Client-ID': clientId,
      referer: 'https://player.twitch.tv',
      origin: 'https://player.twitch.tv',
    }
  })
    .then(res => {
      capturedResponse = res.clone()
      return res
    })
    .then(res => res.text())
    .catch(error => {
      console.debug(capturedResponse)
      throw error
    })
}

function getPlaylistParsed(channel: string): Promise<Exclude<ReturnType<typeof parseM3U>, undefined[]>> {
  channel = channel.toLowerCase()
  return getAccessToken(channel)
    .then(token => getPlaylist(channel, token))
    .then(data => parseM3U(data).filter(d => !!d))
}

export interface StreamUrl {
  quality: 'source' | 'audio only' | string
  resolution: string,
  url: string
}

const cachedStreamUrls: { [channel: string]: StreamUrl[] } = {}

export function invalidateStreamUrl(channel: string) {
  delete cachedStreamUrls[channel]
}

export function cachedStreamUrlProbablyExpired() {
  const failedFetches = getFailedFetchesTimestamps()
  const now = performance.now()
  let recentFailedFetchesAmount = 0
  for (const failedFetch of failedFetches) {
    if (now - failedFetch < 60 * 1000) recentFailedFetchesAmount++
  }
  return recentFailedFetchesAmount >= 3
}

export function getStreamUrls(channel: string): Promise<StreamUrl[]> {
  if (channel in cachedStreamUrls) return Promise.resolve(cachedStreamUrls[channel])
  return getPlaylistParsed(channel)
    .then(playlist => {
      if (playlist.length < 1)
        throw new Error('There were no results, maybe the channel is offline?')

      // Parse playlist with quality options and send to new array of objects
      const streamLinks: StreamUrl[] = []
      for (let item of playlist) {
        if (!('title' in item)) continue

        const nameMatch = item.title.match(/VIDEO=(['"])(.*?)(['"])/) // Raw quality name
        if (!nameMatch) continue
        let name = nameMatch[2]

        if (name === 'chunked') name = 'source'
        else if (name === 'audio_only') name = 'audio only'

        // Resolution
        const resolutionMatch = item.title.match(/RESOLUTION=(.*?),/)
        const resolution = resolutionMatch ? resolutionMatch[1] : null // Audio only does not have a resolution, so we need this check

        if (!resolution) continue

        streamLinks.push({
          quality: name, // Title case the quality
          resolution,
          url: item.file
        })
      }

      cachedStreamUrls[channel] = streamLinks
      return streamLinks
    })
}
