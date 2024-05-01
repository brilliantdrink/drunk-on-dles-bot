import * as fs from 'fs'
import path from 'path'
import type WebSocket from 'ws'

import 'dotenv/config'
import tmi from 'tmi.js'
import {projectDir} from '../dir.js'
// import {saveBan, saveTimeout} from '../db/machtwort.js'
// noinspection ES6PreferShortImport
import {gameStats, todayStats} from './stats/index.js'
// noinspection ES6PreferShortImport
import {scoreCollectors} from '../score-collection/index.js'
import type {DLETypes} from '../dle-detection/frame.js'

const credFileName = path.join(projectDir, '.twitch_credentials')

function getToken(refresh = false): Promise<string> {
  let requestOptions
  if (refresh || fs.existsSync(credFileName)) {
    const credFile = fs.readFileSync(credFileName, 'utf8')
    const oldCredentials = JSON.parse(credFile)
    requestOptions = {
      'client_id': process.env.CHATTER_CLIENT_ID ?? '',
      'client_secret': process.env.CHATTER_CLIENT_SECRET ?? '',
      'grant_type': 'refresh_token',
      'refresh_token': oldCredentials.refresh_token,
    }
  } else {
    requestOptions = {
      'client_id': process.env.CHATTER_CLIENT_ID ?? '',
      'client_secret': process.env.CHATTER_CLIENT_SECRET ?? '',
      'code': process.env.CHATTER_CODE ?? '',
      'grant_type': 'authorization_code',
      'redirect_uri': 'http://localhost:3000',
    }
  }
  return fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(requestOptions)
  })
    .then(res => res.json())
    .then(data => {
      if ('status' in data && data.status === 400) throw new Error(data.message)
      const now = new Date()
      now.setSeconds(now.getSeconds() + data.expires_in)
      data.expires = now.valueOf()
      fs.writeFileSync(credFileName, JSON.stringify(data), 'utf8')
      return data.access_token
    })
}

const token = await getToken()
const drunkOnDLEsBotChannelName = 'DrunkOnDLEsBot'.toLowerCase()
const lbChannelName = 'littlebear36'
const chatChannel = lbChannelName

const client = new tmi.Client({
  options: {
    debug: true,
    messagesLogLevel: 'debug',
  },
  identity: {
    username: chatChannel,
    password: `oauth:${token}`
  },
  channels: [chatChannel,]
})

client.connect()

const statsCommand = ['!DLEsStats'.toLowerCase(), '!DLEStats'.toLowerCase()]
const statsCommandRegex = /!dles?stats ?([a-z-]+)?/
const statsCommandUnknownDle = (game: string) => `elbyFLUSH i don't know what ${game} is`
const ignoreCommand = ['!DLEsIgnore'.toLowerCase(), '!DLEIgnore'.toLowerCase()]
const ignoreCommandRegex = /!dles?ignore ([+-]?\d+[ms]?)/
const ignoreCommandHelp = `specify the timeframe to ignore. "!dlesignore 20s" ignores the coming 20 secs, "!dlesignore -5m" the last 5 mins. new calls don't override old ones`
const ignoreCommandOkayMessage = (time: number) => {
  if (time === 0) return 'Ignoring nothing elbyStare'
  const timeAbs = Math.abs(time)
  const minutes = Math.round(timeAbs / 6) / 10
  const sUnit = timeAbs === 1 ? 'second' : 'seconds'
  const mUnit = minutes === 1 ? 'minute' : 'minutes'
  return `Ignoring the ${time < 0 ? 'last' : 'coming'} ${timeAbs < 60 ? `${timeAbs} ${sUnit}` : `${minutes} ${mUnit}`}`
}
const errorMessage = 'sorry, my code ran into an error. someone will fix it. probably. eventually.'

// client.on('timeout', (channel, username, reason, duration) => saveTimeout(channel, username, reason, duration))
// client.on('ban', (channel, username, reason) => saveBan(channel, username, reason))

client.on('message', (channel, tags, message, self) => {
  // ignore echoed messages
  if (self) return
  const isBroadcaster = tags.badges && tags.badges.broadcaster === '1'
  if (!isBroadcaster && !tags.mod) return

  const messageLowerCase = message.toLowerCase()
  if (statsCommand.some(c => messageLowerCase.startsWith(c))) {
    try {
      const commandMatch = messageLowerCase.match(statsCommandRegex)
      if (!commandMatch) return false // this should never happen
      if (commandMatch[1] && !(commandMatch[1] in scoreCollectors)) return client.say(channel, statsCommandUnknownDle(commandMatch[1]))
      const statsPromise = commandMatch[1] ? gameStats(commandMatch[1] as DLETypes) : todayStats()
      statsPromise.then(stats => client.say(channel, 'elbyG ' + stats))
    } catch (e) {
      setTimeout(() => {
        client.say(channel, errorMessage)
      })
    }
  }/* else if (ignoreCommand.some(c => messageLowerCase.startsWith(c))) {
    const commandMatch = messageLowerCase.match(ignoreCommandRegex)
    if (!commandMatch) client.say(channel, ignoreCommandHelp)
    else {
      const timeString = commandMatch[1]
      let time = null
      try {
        if (timeString.endsWith('m')) {
          const minutes = Number(timeString.substring(0, timeString.length - 1))
          time = minutes * 60
        } else if (timeString.endsWith('s')) {
          time = Number(timeString.substring(0, timeString.length - 1))
        } else {
          time = Number(timeString)
        }
      } catch (e) {
      }
      if (typeof time !== 'number' || isNaN(time)) client.say(channel, ignoreCommandHelp)
      else {
        // ignoreDLEs(time)
        client.say(channel, ignoreCommandOkayMessage(time))
      }
    }
  }*/
})

export function sendMessage(message: string) {
  return client.say(chatChannel, message)
    .catch((error) => {
      console.error('could not send message:')
      console.error(error)
    })
}
