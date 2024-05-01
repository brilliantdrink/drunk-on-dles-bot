import Frame from '../dle-detection/frame.js'
import type State from '../state.js'
import {tradleGetGuessesStructured} from './tradle-get-guesses-structured.js'
import {Color, tradleGetRects} from './tradle-get-rects.js'

export async function collectTradleScore(frame: Frame, state: State): Promise<{
  guesses: number,
  hasWon: boolean | null,
  emojiScore?: string
} | null> {
  if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return collectScoreFromScreen(frame, state)
  } else return null
}

const colorEmojis = {
  [Color.White]: '\u{2b1c}\u{fe0f}', // ⬜
  [Color.Yellow]: '\u{1f7e8}', // 🟨
  [Color.Green]: '\u{1f7e9}', // 🟩
} satisfies { [Key in Color]: string }

const MAX_GUESSES = 6

async function collectScoreFromBoard(frame: Frame, state: State) {
  const tradleRects = await tradleGetRects(frame.imageSharpNoChat)
  const emojiScore = tradleRects.matrix.map(row => row.map(({color}) => colorEmojis[color]).join('')).join('\n')
  // this is only null if the tradleGetRects fucked up
  const hasWon = tradleRects.matrix.at(-1)?.every(cell => cell.color === Color.Green) ?? null
  return {guesses: tradleRects.matrix.length, hasWon, emojiScore}
}

async function collectScoreFromScreen(frame: Frame, state: State) {
  const guessesStructured = await tradleGetGuessesStructured(frame.imageSharpNoChat)
  let hasWon = null
  for (let [country, distance, _, correctness] of guessesStructured) {
    country = country.substring(0, country.indexOf('\n'))
    distance = distance.substring(0, distance.indexOf('\n'))
    correctness = correctness.substring(0, correctness.indexOf('\n'))
    if (!distance.endsWith('m')) return null
    if (!correctness.endsWith('%')) return null
    if (correctness.includes('100%'))
      hasWon = true
  }
  return {
    guesses: guessesStructured.length,
    hasWon: hasWon ? true : (guessesStructured.length === MAX_GUESSES ? false : null)
  }
}
