import {DataTypes} from 'sequelize'
import {Model, sequelize} from './config.js'

class Machtwort extends Model {
  declare type: 'timeout' | 'ban'
  declare channel: string
  declare username: string
  declare reason: string
  declare duration?: number
}

Machtwort.init({
  type: DataTypes.STRING,
  channel: DataTypes.STRING,
  username: DataTypes.STRING,
  reason: DataTypes.STRING,
  duration: DataTypes.INTEGER,
}, {sequelize})

await Machtwort.sync({alter: true})

export async function saveBan(channel: string, username: string, reason: string) {
  const machtwort = Machtwort.build()
  machtwort.type = 'ban'
  machtwort.channel = channel
  machtwort.username = username
  machtwort.reason = reason
  await machtwort.save()
}

export async function saveTimeout(channel: string, username: string, reason: string, duration: number) {
  const machtwort = Machtwort.build()
  machtwort.type = 'timeout'
  machtwort.channel = channel
  machtwort.username = username
  machtwort.reason = reason
  machtwort.duration = duration
  await machtwort.save()
}
