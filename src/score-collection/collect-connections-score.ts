import Frame, {consecutiveSpaceOrLineBreaks} from '../dle-detection/frame.js'
import type State from '../state.js'
import {Color, connectionsGetRects} from './connections-get-rects.js'
import {detectConnections} from '../dle-detection/detect-connections.js'
import {recogniseText} from '../dle-detection/ocr.js'

/*
* Plan is to:
* - continuously track the lives
* - try catch the score screen and analyze
* - if missed use the latest lives amount to deduce guesses
* */

export async function collectConnectionsScore(frame: Frame, state: State): Promise<{
  guesses: number | null,
  lives?: number | null,
  hasWon: boolean | null,
  emojiScore?: string
} | null> {
  if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return await collectScoreFromScreen(frame, state)
  } else return null
}

const colorEmojis = {
  [Color.Yellow]: '\u{1f7e8}', // 🟨
  [Color.Green]: '\u{1f7e9}', // 🟩
  [Color.Blue]: '\u{1f7e6}', // 🟦
  [Color.Purple]: '\u{1f7ea}', // 🟪
} satisfies { [Key in Color]: string }

async function collectScoreFromBoard(frame: Frame, state: State) {
  const connectionRects = await connectionsGetRects(frame.imageSharpNoChat)
  // console.log(connectionRects.matrix)
  const guesses = connectionRects.matrix.length
  const hasWon = connectionRects.matrix.filter(row =>
    row.every(cell => cell.color === row[0].color)
  ).length === 4
  const emojiScore = connectionRects.matrix.map(row =>
    row.map(({color}) => colorEmojis[color]).join('')
  ).join('\n')
  return {guesses, hasWon, emojiScore}
}

const MAX_LIVES = 4

const matchMistakesRemaining = /mistakes remaining:(( [@0og€])*)/

async function collectScoreFromScreen(frame: Frame, state: State) {
  // console.log(frame.recognisedText, frame.recognisedText)
  const livesStringMatch = (await frame.recognisedText)?.match(matchMistakesRemaining)
    ?? (await frame.recognisedInvertedText)?.match(matchMistakesRemaining)
  // console.log(livesStringMatch)
  const hasWon = (await frame.recognisedText)?.includes('next time') ? false : null
  let guesses = null, lives = null
  if (!livesStringMatch) {
    const retrospected = await frame.retrospect(isConnectionsScoreScreen)
    if (retrospected) return collectScoreFromBoard(retrospected, state)
    if (state.score && 'lives' in state.score && typeof state.score.lives === 'number') {
      const minimumPossibleGuesses = 4
      const usedLives = MAX_LIVES - state.score.lives
      guesses = minimumPossibleGuesses + usedLives
      lives = state.score.lives
    } else {
      return null
    }
  } else {
    const [_, livesRawString] = livesStringMatch
    if (livesRawString.trim() === '') lives = 0
    else lives = livesRawString.trim().split(' ').length
  }

  return {guesses, lives, hasWon}
}

async function isConnectionsScoreScreen(frame: Frame) {
  // frame.imageNoChatDes = getDescriptors(frame.imageSharpNoChat)
  frame.recognisedText = recogniseText(frame.imageSharpNoChat)
    .then(recognisedText => recognisedText.replace(consecutiveSpaceOrLineBreaks, ' ').toLowerCase())
  await detectConnections(frame)
  return frame.detectedDle === 'connections' && frame.view === 'score'
}
