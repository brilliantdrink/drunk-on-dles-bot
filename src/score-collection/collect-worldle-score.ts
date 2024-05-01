import Frame from '../dle-detection/frame.js'
import type State from '../state.js'
import {worldleGetGuessesStructured} from './worldle-get-guesses-structured.js'
// import {getFeature, matchFeature} from '../dle-detection/feature-matching.js'
// import {waffleGetRects} from './waffle-get-rects.js'

// const worldleEmojiWindows1 = getFeature('worldle-score-emoji-windows-1.png')

const MAX_GUESSES = 6

export async function collectWorldleScore(frame: Frame, state: State): Promise<{
  guesses: number,
  hasWon: boolean | null
} | null> {
  const guessesStructured = await worldleGetGuessesStructured(frame.imageSharpNoChat)
  let hasWon: boolean | null = null
  for (let [country, distance, _, correctness] of guessesStructured) {
    country = country.substring(0, country.indexOf('\n'))
    distance = distance.substring(0, distance.indexOf('\n'))
    correctness = correctness.substring(0, correctness.indexOf('\n'))
    if (!distance.endsWith('m')) return null
    if (!correctness.endsWith('%')) return null
    if (correctness.includes('100%'))
      hasWon = true
  }
  return {guesses: guessesStructured.length, hasWon: hasWon ? true : (guessesStructured.length === MAX_GUESSES ? false : null)}
}
