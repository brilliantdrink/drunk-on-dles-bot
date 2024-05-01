import Frame from '../dle-detection/frame.js'
import type State from '../state.js'

// score time in seconds

const matchTime = /(\d+):(\d+)/

export async function collectCrosswordMiniScore(frame: Frame, state: State): Promise<{
  time: number | null,
  hasWon: true | null // this is okay, because you can't really loose it
} | null> {
  state.score && 'time' in state.score && (state.score.time = null) // previous time is obsolete
  const matchedTime =
    (await frame.recognisedText)?.match(matchTime) ??
    (await frame.recognisedInvertedText)?.match(matchTime)
  if (!matchedTime) return null
  const minute = Number(matchedTime[1])
  const second = Number(matchedTime[2])
  return {time: minute * 60 + second, hasWon: frame.view === 'score' ? true : null}
}
