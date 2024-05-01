import {getFeature} from './feature-matching.js'
import type Frame from './frame.js'
import {getDetect} from './detection/detect.js'

const globleLogo = getFeature('globle-logo.png')

const detector = getDetect({
  gameplay: {
    features: [{
      image: globleLogo,
      minMatches: 30,
    },],
    text: [{
      string: ['enter the name of any country to make your first guess', 'drag, click, and zoom-in on the globe to help you find your next guess', ' is warmer', ' is cooler', ' is adjacent to the answer', ' not found in database', 'did you mean ', ' is a territory, not a country', 'the mystery country is '],
      maxDistance: 3,
      rects: [{left: 450, top: 205, width: 490, height: 25}],
    },],
  },
  score: {
    text: [{
      string: 'statistics'
    }, {
      string: 'play another game from trainwreck labs'
    },],
  },
})

export async function detectGloble(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'globle'
    return true
  } else return false
}
