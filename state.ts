import type {DLETypes} from './dle-detection/frame.js'
import Frame, {dleDetectors} from './dle-detection/frame.js'
// noinspection ES6PreferShortImport
import {scoreCollectors} from './score-collection/index.js'
// noinspection ES6PreferShortImport
import {generateMessage} from './chatter/messages/index.js'
import {saveMessage} from './db/message.js'
import {saveScore, Score} from './db/scores.js'
// noinspection ES6PreferShortImport
import {sendMessage} from './chatter/index.js'
import {Op} from 'sequelize'

// the day should reset at 6 am za time

export default class State {
  setUpdateFrequency?: (newInterval: number) => void
  game: null | DLETypes
  hasScoreForToday: Partial<{ [Game in DLETypes]: Promise<true> }> = new Proxy({}, {
    async get(target: {}, game: DLETypes): Promise<boolean> {
      const todayMidnight = new Date()
      todayMidnight.setHours(4)
      todayMidnight.setMinutes(0)
      const score = await Score.findOne({where: {game, date: {[Op.gt]: todayMidnight.valueOf()}}})
      return score !== null
    }
  })
  lastDetectedDLEs: (null | DLETypes)[]
  score: Awaited<ReturnType<typeof scoreCollectors[keyof typeof scoreCollectors]>>
  lastUpdatedTime: number

  constructor() {
    this.game = null
    this.score = null
    this.lastDetectedDLEs = []
    this.lastUpdatedTime = 0
  }

  async putFrame(frame: Frame) {
    if (!frame.detectedDle) {
      const lastDetectedDLE = this.lastDetectedDLEs.at(-1)
      if (!lastDetectedDLE) {
        if (this.lastDetectedDLEs.every(v => !v)) {
          this.setUpdateFrequency?.(10000)
        } else {
          this.setUpdateFrequency?.(2000)
        }
        this.game = null
        this.score = null
      } else {
        if (!(await this.hasScoreForToday[lastDetectedDLE])) {
          const scoreFrame = await frame.retrospect(async (frame: Frame) => {
            await frame.detectDlePre()
            const detectDle = dleDetectors[lastDetectedDLE]
            await detectDle(frame)
            return frame.detectedDle === lastDetectedDLE && frame.view === 'score'
          })
          if (scoreFrame) {
            try {
              this.score = await scoreCollectors[lastDetectedDLE as keyof typeof scoreCollectors](scoreFrame, this)
            } catch (e) {
              console.error(e)
            }
          }
        }
      }
    } else {
      this.setUpdateFrequency?.(2000)
      this.game = frame.detectedDle
      if (this.game !== this.lastDetectedDLEs.at(-2)) this.score = null
      try {
        // todo only do this when needed
        if (!(await this.hasScoreForToday[this.game])) {
          this.score = await scoreCollectors[frame.detectedDle as keyof typeof scoreCollectors](frame, this)
        }
      } catch (e) {
        console.error(e)
      }
    }
    this.lastUpdatedTime = frame.timestamp

    this.lastDetectedDLEs.push(frame.detectedDle)
    if (this.lastDetectedDLEs.length > 3) this.lastDetectedDLEs.shift()

    if (this.game && !(await this.hasScoreForToday[this.game])) {
      if (!this.score) return
      if (this.score.hasWon === null) return
      saveScore(this)
      const message = await generateMessage(this.game, this.score)
      saveMessage(this.game, message)
      if (message) sendMessage(message)
    }
  }
}
