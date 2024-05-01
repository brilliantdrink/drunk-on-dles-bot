import * as child_process from 'child_process'
import {fetchRetry} from '../fetch-retry.js'

const urlRegex = /https?:\/\/[A-Za-z0-9$\-_.+!*'(),\/]+/

const failedFetches: number[] = []
export const getFailedFetchesTimestamps = () => failedFetches

export async function fetchFrame(m3u8Url: string) {
  // const start = performance.now()
  const controller = new AbortController()
  let requestDone = false
  setTimeout(() => {
    controller.abort()
    !requestDone && console.error('Request for m3u8Url timed out')
  }, 4000)
  const response = await fetchRetry(3, m3u8Url, {signal: controller.signal})
  requestDone = true
  const playlist = await response.text()

  // it is important to use the last url, because that it the newest segment
  const segmentUrl = playlist.split('\n').reverse()
    .find(line => line.includes('.ts'))
    ?.match(urlRegex)?.[0]
  if (!segmentUrl) {
    console.debug(playlist)
    failedFetches.push(performance.now())
    if (failedFetches.length > 3) failedFetches.shift()
    throw new Error('No segment found')
  }

  requestDone = false
  setTimeout(() => {
    controller.abort()
    !requestDone && console.error('Request for segment timed out')
  }, 6000)
  const segmentArrayBuffer = await fetchRetry(2, segmentUrl, {signal: controller.signal})
    .then(res => res.ok ? res.arrayBuffer() : null)
  requestDone = true
  if (!segmentArrayBuffer) {
    failedFetches.push(performance.now())
    if (failedFetches.length > 3) failedFetches.shift()
    throw new Error('Failed to fetch segment')
  }
  const segment = Buffer.from(segmentArrayBuffer)

  // const startFrameExtraction = performance.now()
  // console.debug(`Prepped frame fetch in ${startFrameExtraction - start}ms`)
  let frame
  try {
    frame = child_process.execSync(
      `ffmpeg -sseof -40ms -t 00:00 -i - -frames:v 1 -q:v 1 -f image2pipe -`,
      {input: segment, stdio: ['pipe', 'pipe', 'ignore'], timeout: 4000}
    )
  } catch (e) {
    console.error(e)
  }
  if (!frame) throw new Error('Failed to extract frame from segment')
  // const end = performance.now()
  // console.debug(`Frame extraction took ${end - startFrameExtraction}ms`)
  return [frame, segment]
}
