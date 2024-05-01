import {getFeature} from './feature-matching.js'
import type Frame from './frame.js'
import {getDetect} from './detection/detect.js'
import {Vector3} from '../score-collection/helpers.js'

const nytGamesLogo = getFeature('nyt-games-logo.png')
// const connectionsLogo = getFeature('connections-logo.png')

const welcomeBackground: Vector3 = [185, 176, 245]

const concludingMessages = ['Perfect', 'Great', 'Solid', 'Phew', 'Next Time'].map(s => s.toLowerCase())
const midGameMessages = ['One away...', 'Already guessed!'].map(s => s.toLowerCase())

const detector = getDetect({
  welcome: {
    colors: [{
      values: welcomeBackground,
      minRelativeCoverage: .14
    },],
    features: [{
      image: nytGamesLogo,
      minMatches: 40,
      expectedPosition: {y: 85, height: 65, x: 65, width: 705},
    },/* { // crossword-mini gameplay screen sometimes matches this for some reason
      image: connectionsLogo,
      minMatches: 30,
      log: true,
      expectedPosition: {y: 155, height: 880, x: 630, width: 125},
      eitherOfKey: 'logoOrLettering',
    },*/],
    text: [{
      string: 'connections',
      expectedPosition: {y: 225, height: 600, x: 25, width: 300},
      textSize: {width: 280, height: 40},
      minTextSizeCoverage: .9,
      // eitherOfKey: 'logoOrLettering',
    },],
  },
  gameplay: {
    features: [{
      image: nytGamesLogo,
      minMatches: 40,
      expectedPosition: {y: 85, height: 65, x: 590, width: 200},
      eitherOfKey: 'topCenter'
    }],
    text: [{
      string: 'create four groups of four!',
    }, {
      string: 'mistakes remaining',
    }, {
      string: concludingMessages,
      rects: [{top: 90, height: 70, left: 610, width: 170}, {top: 90, height: 70, left: 650, width: 90}],
      eitherOfKey: 'topCenter',
    }, {
      string: midGameMessages,
      rects: [{top: 90, height: 70, left: 610, width: 170}, {top: 90, height: 70, left: 650, width: 90}],
      eitherOfKey: 'topCenter',
    },],
  },
  score: {
    text: [{
      string: 'connections',
      expectedPosition: {y: 370, height: 60, x: 550, width: 210},
      textSize: {width: 167, height: 23},
    }, {
      string: 'next puzzle in',
    },]
  },
})

export async function detectConnections(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'connections'
    return true
  } else return false
}
