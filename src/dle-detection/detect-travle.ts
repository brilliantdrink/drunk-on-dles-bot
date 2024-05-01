import type Frame from './frame.js'
import {getColorAmountRelative} from './analyze-color.js'
import {Vector3} from '../score-collection/helpers.js'
import {getDetect} from './detection/detect.js'

const background: Vector3 = [40, 40, 40]
const darkenedBackground: Vector3 = [20, 20, 20]

const detector = getDetect({
  gameplay: {
    colors: [{
      values: background,
      minRelativeCoverage: .6,
    },],
    text: [{
      string: ['today i\'d like to go from ', 'past guesses', 'get a hint'],
    },],
  },
  score: {
    colors: [{
      values: background,
      minRelativeCoverage: .2,
    },{
      values: darkenedBackground,
      minRelativeCoverage: .5,
    },],
    text: [{
      string: ['travle', 'statistics'],
    },],
  },
})

export async function detectTravle(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'travle'
    return true
  } else return false
}
