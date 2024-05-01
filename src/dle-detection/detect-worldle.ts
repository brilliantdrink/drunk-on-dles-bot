import type Frame from './frame.js'
import {getFeature} from './feature-matching.js'
import {getDetect} from './detection/detect.js'
import {Vector3} from '../score-collection/helpers.js'

const worldleHeader = getFeature('worldle-header.png')

const background: Vector3 = [16, 22, 38]

const detector = getDetect({
  gameplay: {
    colors: [{
      values: background,
      minRelativeCoverage: .7
    },],
    features: [{
      image: worldleHeader,
      minMatches: 80,
    },],
  },
})

export async function detectWorldle(frame: Frame): Promise<boolean> {
  if (await detector(frame)) {
    frame.detectedDle = 'worldle'
    return true
  } else return false
}
