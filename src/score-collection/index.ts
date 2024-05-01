import type Frame from '../dle-detection/frame.js'
import type State from '../state.js'
import type {DLETypes} from '../dle-detection/frame.js'
import {collectWordleScore} from './collect-wordle-score.js'
import {collectConnectionsScore} from './collect-connections-score.js'
import {collectCrosswordMiniScore} from './collect-crossword-mini-score.js'
import {collectTradleScore} from './collect-tradle-score.js'
import {collectWaffleScore} from './collect-waffle-score.js'
import {collectWorldleScore} from './collect-worldle-score.js'
import {collectGlobleScore} from './collect-globle-score.js'
import {collectTravleScore} from './collect-travle-score.js'
import {collectTimeguessrScore} from './collect-timeguessr-score.js'

interface Score<Won extends boolean | null> {
  hasWon: Won
}

export type TimeScore<Won extends boolean | null = boolean | null> = Score<Won> & {
  time: Won extends boolean ? number : (number | null)
}

export type GuessesScore<Won extends boolean | null = boolean | null> = Score<Won> & {
  guesses: Won extends boolean ? number : (number | null)
  emojiScore?: string
}

export type CumulativeScore<Won extends boolean | null = boolean | null> = Score<Won> & {
  score: Won extends boolean ? number : (number | null),
  roundScores: ({ total: number, year: number, location: number } | null)[]
}

export const isTimeScore = <Won extends boolean>(value: any): value is TimeScore<Won> => 'time' in value
export const isGuessesScore = <Won extends boolean>(value: any): value is GuessesScore<Won> => 'guesses' in value
export const isCumulativeScore = <Won extends boolean>(value: any): value is CumulativeScore<Won> => 'score' in value

export const scoreCollectors = {
  wordle: collectWordleScore,
  connections: collectConnectionsScore,
  'crossword-mini': collectCrosswordMiniScore,
  tradle: collectTradleScore,
  waffle: collectWaffleScore,
  worldle: collectWorldleScore,
  globle: collectGlobleScore,
  travle: collectTravleScore,
  timeguessr: collectTimeguessrScore,
  // spellcheck: nothing,
  // bandle: nothing,
} satisfies { [key in Exclude<DLETypes, 'bandle' | 'spellcheck'>]: (frame: Frame, state: State) => Promise<GuessesScore | TimeScore | CumulativeScore | null> }

async function nothing(frame: Frame, state: State) {
  return null
}
