import path from 'path'

import {getFeature} from './feature-matching.js'
import type Frame from './frame.js'
import {invokeWorker} from '../python.js'
import {projectDir} from '../dir.js'
import {getDetect} from './detection/detect.js'


const nytGamesLogo = getFeature('nyt-games-logo.png')
const crosswordLogo = getFeature('crossword-logo.png')
const crosswordLogoLettering = getFeature('crossword-logo-lettering.png')
const crosswordScore = getFeature('crossword-score.png')

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'detect_crossword_mini_presence.py')
const request = invokeWorker(pythonScriptPath)

const detector = getDetect({
  welcome: {
    features: [{
      image: nytGamesLogo,
      minMatches: 40,
    }, {
      image: crosswordLogo,
      minMatches: 40,
    },],
    text: [{
      string: 'the mini crossword',
      expectedPosition: {y: 155, height: 880, x: 410, width: 575},
      textSize: {width: 555, height: 51},
    },],
  },
  gameplay: {
    features: [{
      image: nytGamesLogo,
      minMatches: 40,
    }, {
      image: crosswordLogoLettering,
      minMatches: 80,
      eitherOfKey: 'logoOrCrossword',
      expectedPosition: {y: 155, height: 555, x: 80, width: 475},
    },],
    scripts: [{
      async check(frame: Frame) {
        const imageBuffer = await frame.imageSharpNoChat.toBuffer()
        const response = await request(imageBuffer.toString('base64') + '\n')
        return response[0] === '1'
      },
      eitherOfKey: 'logoOrCrossword',
    },],
  },
  score: {
    features: [{
      image: crosswordScore,
      minMatches: 10,
    },],
    text: [{
      string: ['try again next time...', 'the puzzle is filled, but at least one square', 'congratulations!']
    }, {
      string: 'you solved the mini'
    }],
  },
})

export async function detectCrosswordMini(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'crossword-mini'
    return true
  } else return false
}
