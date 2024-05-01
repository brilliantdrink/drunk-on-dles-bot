import {DataTypes} from 'sequelize'
import {Model, sequelize} from './config.js'
import type {DLETypes} from '../dle-detection/frame.js'
import State from '../state.js'
import chalk from 'chalk'
// noinspection ES6PreferShortImport
import {
  CumulativeScore,
  GuessesScore,
  isCumulativeScore,
  isGuessesScore,
  isTimeScore,
  TimeScore
} from '../score-collection/index.js'

export class Score extends Model {
  declare game: DLETypes
  declare date: number
  declare hasWon: boolean
  declare value: number
  declare emojis?: string
  declare additionalData: Record<string, any>
}

Score.init({
  game: DataTypes.STRING,
  date: DataTypes.DATE,
  hasWon: DataTypes.BOOLEAN,
  value: DataTypes.INTEGER,
  emojis: DataTypes.STRING,
  additionalData: DataTypes.JSONB,
}, {sequelize})

await Score.sync({alter: true})

const nonAdditionalDataKeys = ['hasWon', 'time', 'guesses', 'score', 'emojiScore']

export async function saveScore(state: State) {
  const score = Score.build()
  if (!state.game) throw new Error(`Could not save score: state.${chalk.italic('game')} is ${chalk.bold('null')}`)
  if (!state.score) throw new Error(`Could not save score: state.${chalk.italic('score')} is ${chalk.bold('null')}`)
  const stateScore = state.score as GuessesScore | TimeScore | CumulativeScore
  score.game = state.game
  score.date = state.lastUpdatedTime
  score.hasWon = stateScore.hasWon as boolean
  if (isGuessesScore(stateScore)) {
    score.value = stateScore.guesses
    if (stateScore.emojiScore)
      score.emojis = stateScore.emojiScore
  }
  if (isCumulativeScore(stateScore)) score.value = stateScore.score
  if (isTimeScore(stateScore)) score.value = stateScore.time
  score.additionalData = {}
  for (const stateScoreKey in stateScore) {
    if (!stateScore.hasOwnProperty(stateScoreKey)) continue
    if (nonAdditionalDataKeys.includes(stateScoreKey)) continue
    score.additionalData[stateScoreKey] = stateScore[stateScoreKey as keyof typeof stateScore /* ??? typescript */]
  }
  await score.save()
}
