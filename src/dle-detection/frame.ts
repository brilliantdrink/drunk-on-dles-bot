import * as child_process from 'child_process'
import sharp, {type Sharp} from 'sharp'

import type State from '../state.js'
import {getStreamUrls, invalidateStreamUrl, type StreamUrl} from './get-current-stream.js'
import {fetchFrame} from './fetch-frame.js'
import {recogniseText, recogniseTextRects} from './ocr.js'
import {clearFeatureCache, getDescriptors, getFeature, matchFeature} from './feature-matching.js'
import {localiseText} from './text-localisation.js'

import {detectWordle} from './detect-wordle.js'
import {detectConnections} from './detect-connections.js'
import {detectCrosswordMini} from './detect-crossword-mini.js'
import {detectTradle} from './detect-tradle.js'
import {detectWaffle} from './detect-waffle.js'
import {detectWorldle} from './detect-worldle.js'
import {detectGloble} from './detect-globle.js'
import {detectTravle} from './detect-travle.js'
import {detectTimeguessr} from './detect-timeguessr.js'
import {detectBandle} from './detect-bandle.js'

const theBeautifulestBear = getFeature('the-beautifulest-bear.png')
const reactionmaxxingBear = getFeature('reactionmaxxing-bear.png')
export const consecutiveSpaceOrLineBreaks = /[ \n]+/g

export type DLETypes =
  'wordle'
  | 'connections'
  | 'crossword-mini'
  | 'tradle'
  | 'waffle'
  | 'worldle'
  | 'globle'
  | 'travle'
  | 'timeguessr'
  | 'spellcheck'
  | 'bandle'

export default class Frame {
  segment?: Buffer
  retrospected?: Frame
  imageSharp: Sharp
  imageSharpNoChat: Sharp
  imageSharpNoChatInverted: Sharp
  imageNoChatDes: null | Promise<string | null>
  detectedDle: null | DLETypes
  view: null | 'welcome' | 'gameplay' | 'round' | 'score' | 'paywall' | 'paywall2'
  /** @description approximate, do not rely on for calculations */
  timestamp: number
  textRects: null | Promise<{ x: number, y: number, height: number, width: number }[]>
  recognisedText: null | Promise<string>
  recognisedInvertedText: null | Promise<string>
  recognisedTimeguessrTextPromise: null | Promise<string[]>

  cancelableProcessesController: AbortController

  detectorData: Partial<Record<DLETypes, any>>
  perf: {
    frameFetch?: number
    dleDetection?: number
    ocr?: number
    ocrInverted?: number
    ocrTimeguessr?: number
    textRects?: number
    desGeneration?: number
    detectors?: number
    featDetectionBreakdown: {
      wordle?: number,
      connections?: number,
      crosswordMini?: number,
      tradle?: number,
      waffle?: number,
      worldle?: number,
      globle?: number,
      travle?: number,
      timeguessr?: number,
      bandle?: number
    }
  }

  constructor(imagePath: Parameters<typeof sharp>[0], timestamp: number) {
    this.imageSharp = sharp(imagePath)
    // im sorry chat for cutting you out. i know you are very important to the stream, but the bot is getting overwhelmed by your beauty
    this.imageSharpNoChat = this.imageSharp.clone()
      .extract({left: 0, top: 0, width: 1400, height: 1080})
    this.imageSharpNoChatInverted = this.imageSharpNoChat.clone().negate({alpha: false}).threshold(60)
    this.imageNoChatDes = null
    this.detectedDle = null
    this.view = null
    this.timestamp = timestamp
    this.textRects = null
    this.recognisedText = null
    this.recognisedInvertedText = null
    this.recognisedTimeguessrTextPromise = null

    this.detectorData = {}
    this.perf = {featDetectionBreakdown: {}}

    this.cancelableProcessesController = new AbortController()
  }

  static async fromTwitch(channel: string) {
    const start = performance.now()
    const m3u8Url = await getStreamUrls(channel)
      .then(urls => {
        const streamUrl = urls.find(({quality}: StreamUrl) => quality === 'source')
        if (!streamUrl) {
          console.error('Could not find source m3u8 url')
          return false
        }
        return streamUrl.url
      })
    if (!m3u8Url) return false
    const [image, segment] = await fetchFrame(m3u8Url)
    const twoSecondsAgo = new Date((new Date).valueOf()).valueOf()
    const frame = new Frame(image, twoSecondsAgo)
    frame.segment = segment
    // fs.rmSync(imagePath)
    const end = performance.now()
    // console.debug(`Fetched frame in ${end - start}ms`)
    frame.perf.frameFetch = end - start
    return frame
  }

  async detectDlePre() {
    const start = performance.now()
    this.textRects = localiseText(this.imageSharpNoChat).then(res => {
      this.perf.textRects = performance.now() - start
      return res
    })

    this.imageNoChatDes = getDescriptors(this.imageSharpNoChat)
      .then(res => {
        this.perf.desGeneration = performance.now() - start
        return res
      })
    this.recognisedText = recogniseText(this.imageSharpNoChat, undefined, this.cancelableProcessesController)
      .then(text => {
        this.perf.ocr = performance.now() - start
        return text.replace(consecutiveSpaceOrLineBreaks, ' ').toLowerCase()
      })
    this.recognisedInvertedText = recogniseText(this.imageSharpNoChatInverted, undefined, this.cancelableProcessesController)
      .then(text => {
        this.perf.ocrInverted = performance.now() - start
        return text.replace(consecutiveSpaceOrLineBreaks, ' ').toLowerCase()
      })
  }

  async detectDle() {
    // todo: restart if detection is broken
    const start = performance.now()
    await this.detectDlePre()

    const startFeatures = performance.now()
    const ignorePromise = detectIgnore(this)
    await Promise.any([
      detectWordle,
      detectConnections,
      detectCrosswordMini,
      detectTradle,
      detectWaffle,
      detectWorldle,
      detectGloble,
      detectTravle,
      detectTimeguessr,
      // detectBandle,
    ].map(detectDle => callAndRejectIfFalse(detectDle, this)))
      .catch(() => 0)

    const ignore = await ignorePromise

    const end = performance.now()
    // console.debug(`Matched LB in ${startText - start}ms`)
    // console.debug(`Recognized text in ${startFeatures - startText}ms`)
    // console.debug(`Found features in ${end - startFeatures}ms`)
    // console.debug(`Detected DLE in ${end - start}ms`)
    // console.debug(`Started pre DLE detection in ${startFeatures - start}ms`)
    this.perf.detectors = end - startFeatures
    this.perf.dleDetection = end - start

    if (this.detectedDle === null) this.cancelableProcessesController.abort()
    clearFeatureCache()
  }

  retrospect(check: (frame: Frame) => Promise<boolean>, everyNSeconds?: number) {
    if (!this.segment) return false
    everyNSeconds ??= 1 / 3
    let framesSingleBuffer
    try {
      framesSingleBuffer = child_process.execSync(
        `ffmpeg -t 00:00 -i - -r ${1 / everyNSeconds} -q:v 1 -f image2pipe -`,
        {input: this.segment, stdio: ['pipe', 'pipe', 'ignore'], timeout: 6000, maxBuffer: 8192 * 1024}
      )
    } catch (err) {
      console.error(err)
      return null
    }
    const framesArrays: number[][] = [[]]
    let last = null
    for (const char of framesSingleBuffer) {
      (framesArrays.at(-1) as number[]).push(char)
      if (last === 0xff && char === 0xd9) framesArrays.push([])
      last = char
    }
    framesArrays.length -= 1
    return Promise.any(framesArrays.map(array => {
      const buffer = Buffer.from(array)
      const frame = new Frame(buffer, this.timestamp)
      return check(frame).then(isOkay => isOkay ? Promise.resolve(frame) : Promise.reject())
    }))
      .then(frame => {
        this.retrospected = frame
        return frame
      })
      .catch(() => null)
  }
}

async function detectIgnore(frame: Frame) {
  // this means lb is reacting to herself
  const imageNoChatDes = await frame.imageNoChatDes
  if (!imageNoChatDes) return false
  const theBeautifulestBearMatch = matchFeature(imageNoChatDes, theBeautifulestBear)
  const reactionmaxxingBearMatch = matchFeature(imageNoChatDes, reactionmaxxingBear)
  return Boolean(await theBeautifulestBearMatch > 20 && await reactionmaxxingBearMatch > 20 /* todo this number */)
}

export function callAndRejectIfFalse(detectDle: (frame: Frame) => Promise<boolean>, frame: Frame) {
  const start = performance.now()
  return detectDle(frame)
    .finally(() => {
      const end = performance.now()
      const key = detectDle.name.replace('detect', '').toLowerCase()
      if (key && key !== '') frame.perf.featDetectionBreakdown[key as keyof typeof frame.perf.featDetectionBreakdown] = end - start
    })
    .then(throwIfFalse)
}

function throwIfFalse(value: any) {
  if (value === false) throw new Error('')
}

export const dleDetectors = {
  wordle: detectWordle,
  connections: detectConnections,
  'crossword-mini': detectCrosswordMini,
  tradle: detectTradle,
  waffle: detectWaffle,
  worldle: detectWorldle,
  globle: detectGloble,
  travle: detectTravle,
  timeguessr: detectTimeguessr,
  bandle: async () => false,
  spellcheck: async () => false
} satisfies { [key in DLETypes]: (frame: Frame, state: State) => Promise<boolean> }
