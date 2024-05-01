import Frame, {consecutiveSpaceOrLineBreaks} from '../dle-detection/frame.js'
import type State from '../state.js'
import type {CumulativeScore} from './index.js'

export async function collectTimeguessrScore(frame: Frame, state: State): Promise<CumulativeScore | null> {
  if (frame.view === 'round') {
    return collectScoreFromRound(frame, state)
  } else if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return collectScoreFromScreen(frame, state)
  } else return null
}

function ensureScore(existingScore: State['score']): CumulativeScore {
  if (existingScore) return existingScore as CumulativeScore
  else return {score: null, roundScores: [], hasWon: null}
}

const roundScoreRegex = /year location total (\d+)\D+(\d+)\D+(\d+)/

async function collectScoreFromRound(frame: Frame, state: State) {
  const existingScore = ensureScore(state.score)
  if (existingScore?.roundScores.at(-1)) return existingScore
  const scoreText = (await frame.recognisedTimeguessrTextPromise)?.[2]
  if (!scoreText) return existingScore
  const roundScoreMatch = scoreText.toLowerCase().replace(consecutiveSpaceOrLineBreaks, ' ').match(roundScoreRegex)
  if (!roundScoreMatch) return existingScore
  existingScore.roundScores[existingScore?.roundScores.length - 1] = {
    year: Number(roundScoreMatch[1]),
    location: Number(roundScoreMatch[2]),
    total: Number(roundScoreMatch[3]),
  }
  return existingScore
}

const decimalSeparatorRegex = /[.,]/
const boardScoreRegex = /([\d,.]+?)\.\.\./

async function collectScoreFromBoard(frame: Frame, state: State) {
  const existingScore = ensureScore(state.score)
  const boardScoreMatch = (await frame.recognisedInvertedText)?.match(boardScoreRegex)
  if (!boardScoreMatch) return existingScore
  existingScore.score = Number(boardScoreMatch[1].replace(decimalSeparatorRegex, ''))
  existingScore.hasWon = true
  return existingScore
}

const screenScoreRegex = /(\d)\/5 ([\d,.]+)/

async function collectScoreFromScreen(frame: Frame, state: State) {
  const existingScore = ensureScore(state.score)
  const screenScoreMatch = (await frame.recognisedInvertedText)?.match(screenScoreRegex)
  if (!screenScoreMatch) return existingScore
  existingScore.score = Number(screenScoreMatch[2].replace(decimalSeparatorRegex, ''))
  const roundNumber = Number(screenScoreMatch[1])
  if (existingScore.roundScores.length < roundNumber)
    existingScore.roundScores.push(null)
  return existingScore
}
