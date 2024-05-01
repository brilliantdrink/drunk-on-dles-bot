import {DataTypes} from 'sequelize'
import {Model, sequelize} from './config.js'
import type {DLETypes} from '../dle-detection/frame.js'
import State from '../state.js'

class Measurement extends Model {
  declare game: null | DLETypes
  declare lastDetectedDLEs: (null | DLETypes)[]
  declare score: any
  declare lastUpdatedTime: number
}

Measurement.init({
  game: {
    type: DataTypes.ENUM,
    values: ['wordle', 'connections', 'crossword-mini', 'tradle', 'waffle', 'worldle', 'globle', 'travle', 'timeguessr', 'spellcheck', 'bandle'],
  },
  lastDetectedDLEs: DataTypes.JSONB,
  score: DataTypes.JSONB,
  lastUpdatedTime: DataTypes.DATE,
}, {sequelize})

await Measurement.sync({alter: true})

export async function saveState(state: State) {
  const measurement = Measurement.build()
  if (state.game)
    measurement.game = state.game
  if (state.lastDetectedDLEs)
    measurement.lastDetectedDLEs = state.lastDetectedDLEs
  if (state.score)
    measurement.score = state.score
  if (state.lastUpdatedTime)
    measurement.lastUpdatedTime = state.lastUpdatedTime

  await measurement.save()
}
