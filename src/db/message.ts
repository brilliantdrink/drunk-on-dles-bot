import {DataTypes} from 'sequelize'
import {Model, sequelize} from './config.js'
import type {DLETypes} from '../dle-detection/frame.js'

class Message extends Model {
  declare game: DLETypes
  declare message: string
}

Message.init({
  game: DataTypes.STRING,
  message: DataTypes.STRING,
}, {sequelize})

await Message.sync({alter: true})

export async function saveMessage(game: DLETypes, message: string | null) {
  const messageEntry = Message.build()
  messageEntry.game = game
  messageEntry.message = message ?? 'NONE'
  await messageEntry.save()
}
