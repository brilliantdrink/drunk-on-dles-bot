// import cliProgress, {SingleBar} from 'cli-progress'

import Frame from './dle-detection/frame.js'
import Scheduler from './scheduler.js'
import State from './state.js'

import './db'
import {saveFrame} from './db/frames.js'
import {saveState} from './db/measurements.js'
import {cachedStreamUrlProbablyExpired, invalidateStreamUrl} from './dle-detection/get-current-stream.js'

const fiveMinutesInMilliseconds = /*5 * 60 * */1000
let countdownInterval: NodeJS.Timeout | null = null
let offlineScheduler: Scheduler
let liveScheduler: Scheduler, state: State
// let bar: SingleBar

const CHANNEL = 'littlebear36'

function main() {
  // this will start immediately, other than set interval
  offlineScheduler = Scheduler.start(async () => {
    const channelIsLive = await isLive(CHANNEL)
    if (!channelIsLive) return
    offlineScheduler.stop()

    /*bar = new cliProgress.SingleBar({
      clearOnComplete: false,
      hideCursor: true,
      format: 'Int: {updateInterval} | DLE: {detectedDle} | Detection time: {time}ms | {value} | {msg}',
    });

    bar.start(Infinity, 0, {
      msg: '',
      updateInterval: 2000,
      detectedDle: null,
      time: 0,
    })*/
    state = new State()
    liveScheduler = Scheduler.start(findState, 2000)
    state.setUpdateFrequency = (newInterval: number) => liveScheduler.interval = newInterval
  }, fiveMinutesInMilliseconds)
}

main()

/*
* Sometimes the detection gets stuck on slow performance. I don't know why, and im too lazy to find out,
* so I just make the process shit pant, so that pm2 restarts it, which brings back normal performance
* */
let lastDleDetectionTimes: number[] = []

async function solveNoStream() {
  invalidateStreamUrl(CHANNEL)
  if (!(await isLive(CHANNEL))) {
    liveScheduler.stop()
    offlineScheduler.start()
  }
}

async function findState() {
  if (cachedStreamUrlProbablyExpired()) await solveNoStream()
  /*bar.increment({
    msg: 'Done',
    updateInterval: liveScheduler.interval,
    detectedDle: state.game,
    time: null,
  })*/
  // const frameIndex = (bar as unknown as { value: number }).value
  // countdownInterval && clearInterval(countdownInterval)
  // bar.update({msg: 'Fetching frame...'})
  const frame = await Frame.fromTwitch(CHANNEL)
  if (!frame) {
    await solveNoStream()
    return
  }
  // bar.update({msg: 'Detecting DLE...'})
  await frame.detectDle()
  /*bar.update({
    msg: 'Updating state...',
    time: Math.round((frame.perf.dleDetection ?? 0) * 100) / 100
  })*/
  if (frame.perf.dleDetection) lastDleDetectionTimes.push(frame.perf.dleDetection)
  if (lastDleDetectionTimes.length > 4) lastDleDetectionTimes.shift()
  state.putFrame(frame).then(() => {
    // bar.update({msg: 'Trigger save...'})
    saveFrame(frame)
    saveState(state)
    if (lastDleDetectionTimes.reduce((a, b) => a + b) / lastDleDetectionTimes.length > 4000)
      process.exit(0)
    // if (frameIndex !== (bar as unknown as { value: number }).value) return
    /*countdownInterval = setInterval(() => {
      const countdownMs = liveScheduler.nextExec as number - performance.now()
      bar.update({msg: `Done, next in ${(countdownMs / 1000).toFixed(1)}s`})
    }, 100)*/
  })
}

function isLive(channel: string) {
  return fetch(`https://www.twitch.tv/${channel}`)
    .then(res => res.text())
    .then(htmlText => htmlText.includes('isLiveBroadcast'))
}
