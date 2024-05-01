import {DataTypes} from 'sequelize'
import {sequelize, Model} from './config.js'
import type {DLETypes} from '../dle-detection/frame.js'
import {Score} from './scores.js'

export class PreviousScoreData extends Model {
  declare game: DLETypes
  declare gamesPlayed?: number
  declare longestStreak?: number
  declare distribution?: number[]
}

PreviousScoreData.init({
  game: DataTypes.STRING,
  gamesPlayed: DataTypes.INTEGER,
  longestStreak: DataTypes.INTEGER,
  distribution: DataTypes.ARRAY(DataTypes.INTEGER),
}, {sequelize})

await PreviousScoreData.sync({force: true})

await PreviousScoreData.create({
  game: 'wordle',
  gamesPlayed: 130,
  longestStreak: 69,
  distribution: [0, 2, 20, 46, 43, 17]
})
await PreviousScoreData.create({
  game: 'travle',
  gamesPlayed: 112,
  longestStreak: 40,
  distribution: [112] // todo: get the distribution somehow??
})
await PreviousScoreData.create({
  game: 'globle',
  gamesPlayed: 131,
  longestStreak: 62,
  distribution: [131]
})

const wordleScores = [
  {date: "4 Apr 2024", hasWon: true, value: 3, emojis: "🟨⬛️⬛️🟨⬛️\n🟨⬛️🟩🟩⬛️\n🟩🟩🟩🟩🟩"},
  {date: "5 Apr 2024", hasWon: true, value: 4, emojis: "⬛️⬛️⬛️⬛️⬛️\n⬛️⬛️⬛️⬛️⬛️\n🟨🟨⬛️⬛️🟩\n🟩🟩🟩🟩🟩"},
  {
    date: "6 Apr 2024",
    hasWon: true,
    value: 6,
    emojis: "⬛️⬛️⬛️⬛️⬛️\n🟨⬛️⬛️⬛️⬛️\n⬛️🟩⬛️🟨⬛️\n⬛️🟩🟩🟩🟩\n⬛️🟩🟩🟩🟩\n🟩🟩🟩🟩🟩"
  },
  {date: "7 Apr 2024", hasWon: true, value: 5, emojis: "⬛️🟨⬛️⬛️⬛️\n🟨⬛️⬛️⬛️🟨\n⬛️🟨⬛️⬛️⬛️\n⬛️🟩🟨🟨⬛️\n🟩🟩🟩🟩🟩"},
  {date: "8 Apr 2024", hasWon: true, value: 4, emojis: "⬛️⬛️⬛️🟨🟨\n⬛️⬛️⬛️⬛️🟩\n⬛️⬛️⬛️⬛️⬛️\n🟩🟩🟩🟩🟩"},
  {date: "9 Apr 2024", hasWon: true, value: 5, emojis: "🟩⬛️⬛️⬛️🟩\n⬛️⬛️🟨⬛️⬛️\n🟩⬛️⬛️🟩🟩\n⬛️⬛️⬛️⬛️⬛️\n🟩🟩🟩🟩🟩"},
  {date: "11 Apr 2024", hasWon: true, value: 5, emojis: "⬛️⬛️⬛️⬛️🟩\n🟨⬛️⬛️⬛️⬛️\n⬛️⬛️🟨🟩🟩\n⬛️🟩🟩🟩🟩\n🟩🟩🟩🟩🟩"},
  {date: "12 Apr 2024", hasWon: true, value: 5, emojis: "⬛️⬛️🟨⬛️⬛️\n⬛️⬛️⬛️⬛️⬛️\n⬛️🟨⬛️🟨⬛️\n🟨🟨⬛️⬛️🟩\n🟩🟩🟩🟩🟩"},
  {date: "15 Apr 2024", hasWon: true, value: 5, emojis: "⬛️⬛️⬛️⬛️🟨\n⬛️⬛️🟩⬛️⬛️\n⬛️🟨⬛️⬛️⬛️\n🟨⬛️🟩⬛️🟨\n🟩🟩🟩🟩🟩"},
  {date: "16 Apr 2024", hasWon: true, value: 4, emojis: "⬛️🟨⬛️⬛️⬛️\n🟩⬛️⬛️🟨⬛️\n🟩🟩🟩⬛️⬛️\n🟩🟩🟩🟩🟩"},
  {date: "17 Apr 2024", hasWon: true, value: 5, emojis: "⬛️⬛️⬛️⬛️🟩\n⬛️🟨⬛️⬛️🟨\n⬛️⬛️⬛️⬛️⬛️\n🟩⬛️🟨⬛️🟩\n🟩🟩🟩🟩🟩"},
  {date: "18 Apr 2024", hasWon: true, value: 4, emojis: "⬛️🟩⬛️⬛️🟨\n🟨⬛️⬛️⬛️⬛️\n⬛️🟩🟩🟩⬛️\n🟩🟩🟩🟩🟩"},
  {date: "19 Apr 2024", hasWon: true, value: 5, emojis: "⬛️🟩⬛️⬛️🟩\n⬛️🟩🟨⬛️🟩\n⬛️⬛️⬛️⬛️⬛️\n🟨🟨⬛️⬛️⬛️\n🟩🟩🟩🟩🟩"},
  {date: "20 Apr 2024", hasWon: true, value: 4, emojis: "⬛️⬛️⬛️⬛️⬛️\n⬛️🟨⬛️⬛️⬛️\n🟨⬛️🟨🟨🟩\n🟩🟩🟩🟩🟩"},
  {
    date: "21 Apr 2024",
    hasWon: false,
    value: 6,
    emojis: "⬛️⬛️🟨⬛️⬛️\n⬛️⬛️⬛️⬛️⬛️\n⬛️🟩⬛️🟩⬛️\n⬛️🟩🟩🟩🟩\n⬛️🟩🟩🟩🟩\n⬛️🟩🟩🟩🟩"
  }, {
    date: "22 Apr 2024",
    hasWon: true,
    value: 4,
    emojis: "⬛️🟩⬛️⬛️🟨\n⬛️⬛️⬛️🟨⬛️\n🟨⬛️⬛️⬛️⬛️\n🟩🟩🟩🟩🟩"
  }, {
    date: "23 Apr 2024",
    hasWon: true,
    value: 5,
    emojis: "⬛️⬛️⬛️⬛️🟨\n⬛️🟩⬛️⬛️⬛️\n⬛️⬛️⬛️⬛️⬛️\n⬛️🟩⬛️🟩🟩\n🟩🟩🟩🟩🟩"
  },
]
await Promise.all(wordleScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'wordle'}})) return
  return Score.create({game: 'wordle', date, hasWon: score.hasWon, value: score.value, emojis: score.emojis})
}))

const connectionsScores = [{
  date: "22 Apr 2024",
  hasWon: true,
  value: 4,
  emojis: "🟩🟩🟩🟩\n🟨🟨🟨🟨\n🟪🟪🟪🟪\n🟦🟦🟦🟦"
}, {
  date: "23 Apr 2024",
  hasWon: true,
  value: 4,
  emojis: "🟩🟩🟩🟩\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n🟪🟪🟪🟪"
},]
await Promise.all(connectionsScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'connections'}})) return
  return Score.create({game: 'connections', date, hasWon: score.hasWon, value: score.value, emojis: score.emojis})
}))

const crosswordMiniScores = [{
  date: "22 Apr 2024",
  hasWon: true,
  value: 283,
}, {
  date: "23 Apr 2024",
  hasWon: true,
  value: 107,
},]
await Promise.all(crosswordMiniScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'crossword-mini'}})) return
  return Score.create({game: 'crossword-mini', date, hasWon: score.hasWon, value: score.value})
}))

// @ts-ignore
const waffleScores = [{
  date: "23 Apr 2024",
  hasWon: true,
  value: 14,
}]
// @ts-ignore
await Promise.all(waffleScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'waffle'}})) return
  return Score.create({game: 'waffle', date, hasWon: score.hasWon, value: score.value})
}))

const travleScores = [{
  date: "22 Apr 2024",
  hasWon: true,
  value: 3
}, {
  date: "23 Apr 2024",
  hasWon: true,
  value: 4
},]
await Promise.all(travleScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'travle'}})) return
  return Score.create({game: 'travle', date, hasWon: score.hasWon, value: score.value})
}))

const globleScores = [{
  date: "22 Apr 2024",
  hasWon: true,
  value: 8
}, {
  date: "23 Apr 2024",
  hasWon: true,
  value: 8
},]
await Promise.all(globleScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'globle'}})) return
  return Score.create({game: 'globle', date, hasWon: score.hasWon, value: score.value})
}))

const timeguessrScores = [{
  date: "22 Apr 2024",
  hasWon: true,
  value: 39189
}, {
  date: "23 Apr 2024",
  hasWon: true,
  value: 45006
},]
await Promise.all(timeguessrScores.map(async score => {
  const date = new Date(score.date)
  date.setHours(6)
  if (await Score.findOne({where: {date, game: 'timeguessr'}})) return
  return Score.create({game: 'timeguessr', date, hasWon: score.hasWon, value: score.value})
}))
