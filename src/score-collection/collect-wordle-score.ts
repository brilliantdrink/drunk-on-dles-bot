import Frame from '../dle-detection/frame.js'
import {Color, wordleGetRects} from './wordle-get-rects.js'
import type State from '../state.js'
import {wordleGetDistribution} from './wordle-get-distribution.js'
import {mapRange, roundToDecimal} from './helpers.js'

export async function collectWordleScore(frame: Frame, state: State) {
  if (frame.view === 'paywall' || frame.view === 'paywall2') {
    return deduceScoreFromBefore(frame, state)
  } else if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return collectScoreFromScreen(frame, state)
  } else return null
}

async function deduceScoreFromBefore(frame: Frame, state: State): ReturnType<typeof collectScoreFromScreen> {
  const won = (await frame.recognisedText)?.includes('congratulations')
  const lost = (await frame.recognisedText)?.includes('thanks for playing today')
  const existingScore = state.score as Awaited<ReturnType<typeof collectScoreFromScreen>>
  if (!won && !lost) return existingScore
  const colorEmoji = won ? colorEmojis[Color.Green] : colorEmojis[Color.Gray]
  return {
    guesses: existingScore.guesses + 1,
    emojiScore: existingScore.emojiScore + '\n' + colorEmoji + colorEmoji + colorEmoji + colorEmoji,
    hasWon: won as boolean
  }
}

async function collectScoreFromBoard(frame: Frame, state: State) {
  const wordleDistribution = await wordleGetDistribution(frame.imageSharpNoChat)
  const barIsGreen = wordleDistribution.map(({bgrColor}) => {
    const greenness = roundToDecimal(mapRange(bgrColor[1], (bgrColor[0] + bgrColor[2]) / 2, 255))
    return greenness > .2
  })
  const hasWon = barIsGreen.includes(true)
  return {guesses: hasWon ? barIsGreen.indexOf(true) + 1 : 6, hasWon}
}

const colorEmojis = {
  [Color.Gray]: '\u{2b1b}\u{fe0f}', // ⬛
  [Color.Yellow]: '\u{1f7e8}', // 🟨
  [Color.Green]: '\u{1f7e9}', // 🟩
} satisfies { [Key in Exclude<Color, Color.DarkGray>]: string }

const MAX_GUESSES = 6

async function collectScoreFromScreen(frame: Frame, state: State) {
  const wordleRects = await wordleGetRects(frame.imageSharpNoChat)

  const greenLine = wordleRects.matrix.findIndex(line =>
    line.length === 5 && line.every(rect => rect.color === Color.Green)
  )

  const fullRows = wordleRects.matrix
    .filter(line =>
      line.every(rect => rect.color !== Color.DarkGray)
    )

  const emojiScore = fullRows.map(row =>
    row.map(({color}) =>
      colorEmojis[color as Exclude<Color, Color.DarkGray>]
    ).join('')
  ).join('\n')

  let guesses = greenLine === -1 ? fullRows.length : greenLine + 1
  let hasWon = greenLine !== -1 ? true : (guesses === MAX_GUESSES ? false : null)

  return {guesses, emojiScore, hasWon}
}
