import type {DLETypes} from '../../dle-detection/frame.js'
// noinspection ES6PreferShortImport
import {isCumulativeScore, isGuessesScore, isTimeScore, scoreCollectors} from '../../score-collection/index.js'
import {getMessages} from './generic-index.js'
import {Score} from '../../db/scores.js'
import {Op} from 'sequelize'

const weightedCoinFlip = (chance: number) => Math.random() <= chance
const anyOf = (amount: number) => Math.floor(Math.random() * amount)

const chanceOfWritingMessageWhenGud = 4 / 5
const chanceOfWritingMessageWhenBed = 1 / 3
const chanceOfWritingGenericMessage = 1 / 2
const chanceOfWritingVerySpecificMessage = 2 / 3

const scoreBetterWorsePercentage = (value: number, average: number) => {
  return Math.round(100 * ((value - average) / average)) / 100
}

// todo try get special messages in (when doing badly): three stripe flags, island nations, nyt bad

export interface NormalisedScore {
  type: 'guesses' | 'time' | 'cumulative',
  value: number
  average: number
  betterWorsePercentage: number
  scoreWord: ScoreWord
}

export type MessageComposer = (score: NormalisedScore, gameName: string) => string
export type ScoreWord = 'better' | 'typical' | 'worse' | 'lost'
export type MessageComposeLevels = { [SW in ScoreWord]: MessageComposer[] }
// const gameSpecificMessages: Partial<{ [Game in DLETypes]: MessageComposeLevels }> = {}
const groupSpecificMessages: Map<DLETypes[], MessageComposeLevels> = new Map()

export async function generateMessage<Game extends DLETypes>(game: Game, score: Exclude<Awaited<ReturnType<typeof scoreCollectors[Game]>>, null>) {
  const lastWeekTodayMidnight = new Date()
  lastWeekTodayMidnight.setHours(0)
  lastWeekTodayMidnight.setMinutes(0)
  lastWeekTodayMidnight.setDate(lastWeekTodayMidnight.getDate() - 7)
  const lastWeekScores = await Score.findAll({where: {game, date: {[Op.gt]: lastWeekTodayMidnight.valueOf()}}})
  const lastWeekAvg =
    lastWeekScores.reduce((acc, score) => acc + score.value, 0) / lastWeekScores.length
  const normalisedScore = await toNormalisedScore(score, lastWeekAvg)
  if (!normalisedScore) return null
  const isBadRun = normalisedScore.scoreWord === 'lost' || normalisedScore.scoreWord === 'worse'
  const writeMessage = weightedCoinFlip(isBadRun ? chanceOfWritingMessageWhenBed : chanceOfWritingMessageWhenGud)
  if (!writeMessage) return null
  const hasSpecificMessages = game in groupSpecificMessages
  const writeGenericMessage = weightedCoinFlip(chanceOfWritingGenericMessage)
  if (!hasSpecificMessages || writeGenericMessage) {
    const messagesOfLevel = getMessages(normalisedScore.scoreWord, normalisedScore.type)
    return messagesOfLevel[anyOf(messagesOfLevel.length)](normalisedScore, gameNames[game])
  } else {
    // const writeVerySpecificMessage = weightedCoinFlip(chanceOfWritingVerySpecificMessage)
    // if ()
    // return gameSpecificMessages[game](normalisedScore, gameNames[game])
    // todo: choose from and compose game-specific message
    return null
  }
}

// globle ghana someday
// wordle "maybe" someday

export async function toNormalisedScore(score: Exclude<Awaited<ReturnType<typeof scoreCollectors[keyof typeof scoreCollectors]>>, null>, average: number): Promise<null | NormalisedScore> {
  let type: NormalisedScore['type'] = null!,
    value: NormalisedScore['value'] = null!,
    lessIsBetter: boolean = null!
  if (isTimeScore(score)) {
    type = 'time'
    value = score.time
    lessIsBetter = true
  } else if (isGuessesScore(score)) {
    type = 'guesses'
    value = score.guesses
    lessIsBetter = true
  } else if (isCumulativeScore(score)) {
    type = 'cumulative'
    value = score.score
    lessIsBetter = false
  }
  if (!type || !value) return null
  let betterWorsePercentage = scoreBetterWorsePercentage(value, average) * (lessIsBetter ? -1 : 1)

  let scoreWord: NormalisedScore['scoreWord']
  if (score.hasWon === false) scoreWord = 'lost'
  else if (betterWorsePercentage >= .5) scoreWord = 'better'
  else if (betterWorsePercentage <= -.5) scoreWord = 'worse'
  else scoreWord = 'typical'

  return {type, value, average, betterWorsePercentage, scoreWord}
}

export const gameNames: { [Game in DLETypes]: string } = {
  wordle: 'Wordle',
  connections: 'Connections',
  'crossword-mini': 'Crossword Mini',
  tradle: 'Tradle',
  waffle: 'Waffle',
  worldle: 'Worldle',
  globle: 'Globle',
  travle: 'Travle',
  timeguessr: 'Timeguessr',
  spellcheck: 'Spellcheck',
  bandle: 'Bandle',
}
