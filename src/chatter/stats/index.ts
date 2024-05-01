import {Op} from 'sequelize'
import {DLETypes} from '../../dle-detection/frame.js'
import {sequelize} from '../../db/config.js'
import {Score} from '../../db/scores.js'
import {formatDateTime} from '../format-date-time.js'
// noinspection ES6PreferShortImport
import {gameNames, NormalisedScore} from '../messages/index.js'
import {PreviousScoreData} from '../../db/previous-score-data.js'

const longestStreakQuery = `
    with recursive cte as (select game, date, 1 as cnt
    from "Scores"
    where game = :game
    union all
    select a.game, a.date, c.cnt + 1
    from "Scores" a
             inner join cte c
                        on a.game = c.game
                            and a.date::date = c.date::date + interval '1' day)
    select game, max(cnt) as longest_streak
    from cte
    group by game
`
const latestStreakQuery = `
    with recursive cte as (select game, date, 1 as cnt
    from "Scores"
    where game = :game
    union all
    select a.game, a.date, c.cnt + 1
    from "Scores" a
             inner join cte c
                        on a.game = c.game
                            and a.date::date = c.date::date + interval '1' day)
    select game, max(cnt) as latest_streak
    from cte
    group by date, game
    order by game, date desc
        limit 1
`

const summaryFunctions = {
  guesses: guessesGamesSummary,
  time: guessesTimeSummary,
  cumulative: guessesCumulativeSummary,
} satisfies { [Key in NormalisedScore['type']]: (score: Score) => string }

// i don't like this (｡•́︿•̀｡)
const gameType = {
  wordle: 'guesses',
  connections: 'guesses',
  'crossword-mini': 'time',
  tradle: 'guesses',
  waffle: 'guesses',
  worldle: 'guesses',
  globle: 'guesses',
  travle: 'guesses',
  timeguessr: 'cumulative',
  spellcheck: 'guesses', // ???
  bandle: 'guesses',
} satisfies { [Key in DLETypes]: NormalisedScore['type'] }

export async function gameStats(game: DLETypes): Promise<string> {
  const latestScore = await Score.findOne({where: {game}, order: [['date', 'DESC']]})
  if (!latestScore) return `no entries for ${game} yet.`
  const previousScoreData = await PreviousScoreData.findOne({where: {game}})
  const res = await sequelize.query(longestStreakQuery, {replacements: {game}})
  const [[{longest_streak}]] = res
  const longestStreak = Math.max(longest_streak, previousScoreData?.longestStreak ?? 0)
  const [[{latest_streak}]] = await sequelize.query(latestStreakQuery, {replacements: {game}})
  const summary = summaryFunctions[gameType[game]](latestScore)

  const gameScores = await Score.findAll({where: {game}})
  const gamesPlayed = gameScores.length + (previousScoreData?.gamesPlayed ?? 0)
  let won = previousScoreData?.distribution ? previousScoreData?.distribution.reduce((a: number, b: number) => a + b, 0) : 0
  for (const gameScore of gameScores) {
    if (gameScore.hasWon) won++
  }

  return `${gameNames[game]}, seen ${formatDateTime(new Date(latestScore.date))};\n` +
    `${summary};\n` +
    `current streak: ${latest_streak}, longest streak: ${longestStreak}${longestStreak === 69 ? ' (nice)' : ''};\n` +
    `played: ${gamesPlayed}${gameType[game] === 'guesses' ? `, win %: ${Math.round((won / gamesPlayed) * 100)}` : ''}`
}

function guessesGamesSummary(score: Score, short = false): string {
  if (short) return `${score.hasWon ? 'W' : 'L'} in ${score.value}`
  return `${score.hasWon ? 'won' : 'lost'} with ${score.value} ${score.value === 1 ? 'guess' : 'guesses'}`
}

function guessesTimeSummary(score: Score, short = false): string {
  const minutes = (Math.floor(score.value / 60))
    .toLocaleString('en', {minimumIntegerDigits: 1, maximumFractionDigits: 0})
  const seconds = (score.value % 60)
    .toLocaleString('en', {minimumIntegerDigits: 2, maximumFractionDigits: 0})
  if (short) return `${minutes}:${seconds}`
  return `completed in ${minutes}:${seconds}`
}

function guessesCumulativeSummary(score: Score, short = false): string {
  const formattedScoreValue = score.value.toLocaleString('en', {maximumFractionDigits: 0})
  if (short) return formattedScoreValue
  return `completed with a score of ${formattedScoreValue}`
}

export async function todayStats(): Promise<string> {
  const todayMidnight = new Date()
  todayMidnight.setHours(4)
  todayMidnight.setMinutes(0)
  const todayScores = await Score.findAll({where: {date: {[Op.gt]: todayMidnight.valueOf()}}})
  if (todayScores.length === 0) return 'no dles seen today'
  return todayScores.map(score => {
    const summary = summaryFunctions[gameType[score.game]](score, true)
    return `${gameNames[score.game]}: ${summary};`
  }).join('\n')
}
