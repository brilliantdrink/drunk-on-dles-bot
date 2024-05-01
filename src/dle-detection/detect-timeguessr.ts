import {getFeature} from './feature-matching.js'
import type Frame from './frame.js'
import {Vector3} from '../score-collection/helpers.js'
import {getDetect} from './detection/detect.js'
import {TextLogicalOperation} from './detection/types.js'

const timeguessrLogo = getFeature('timeguessr-logo.png')
const timeguessrMapToolbar = getFeature('timeguessr-map-toolbar.png')

const timeguessrBackground: Vector3 = [233, 233, 222]
const timeguessrAccentA: Vector3 = [189, 79, 83]
const timeguessrAccentB: Vector3 = [205, 101, 92]
const white: Vector3 = [255, 255, 255]

const detector = getDetect({
  welcome: {
    colors: [{
      values: timeguessrBackground,
      minRelativeCoverage: .7,
    }, {
      values: timeguessrAccentA,
      minRelativeCoverage: .04,
      eitherOfKey: 'accent',
    }, {
      values: timeguessrAccentB,
      minRelativeCoverage: .04,
      eitherOfKey: 'accent',
    },],
    features: [{
      image: timeguessrLogo,
      minMatches: 20,
    },],
    text: [{
      string: 'play',
      expectedPosition: {y: 630, x: 440, height: 65, width: 100},
      expectedPositionAsRect: true,
      textSize: {width: 85, height: 28},
    },{
      string: 'daily',
      expectedPosition: {y: 630, x: 855, height: 65, width: 115},
      expectedPositionAsRect: true,
      textSize: {width: 102, height: 28},
    },],
  },
  gameplay: {
    colors: [{
      values: timeguessrBackground,
      minRelativeCoverage: .15,
    }, {
      values: timeguessrAccentA,
      minRelativeCoverage: .015,
      eitherOfKey: 'accent',
    }, {
      values: timeguessrAccentB,
      minRelativeCoverage: .015,
      eitherOfKey: 'accent',
    },],
    features: [{
      image: timeguessrLogo,
      minMatches: 10,
    }, {
      image: timeguessrMapToolbar,
      minMatches: 5,
    },],
  },
  round: {
    colors: [{
      values: timeguessrBackground,
      minRelativeCoverage: .2,
    }, {
      values: timeguessrAccentA,
      minRelativeCoverage: .007,
      eitherOfKey: 'accent',
    }, {
      values: timeguessrAccentB,
      minRelativeCoverage: .007,
      eitherOfKey: 'accent',
    },],
    text: [{
      string: ['you were', 'years off'],
      logicalOperation: TextLogicalOperation.and,
      eitherOfKey: 'year',
      rects: [{top: 200, left: 0, height: 170, width: 480}],
      maxDistance: 3,
    }, {
      string: 'you got it spot on!',
      eitherOfKey: 'year',
      rects: [{top: 200, left: 0, height: 170, width: 480}],
    }, {
      string: ['your guess was', 'from the correct location'],
      logicalOperation: TextLogicalOperation.and,
      rects: [{top: 900, left: 0, height: 130, width: 480}],
    }, {
      string: ['year', 'location', 'total'],
      logicalOperation: TextLogicalOperation.and,
      rects: [{top: 890, left: 480, height: 140, width: 600}],
      psm: 6,
    },],
  },
  score: {
    colors: [{
      values: white,
      minRelativeCoverage: .008,
      maxRelativeCoverage: .012,
    },],
    text: [{
      string: ['play again', 'new game', 'leaderboard'],
      logicalOperation: TextLogicalOperation.and,
    }, {
      string: 'until next daily',
    },],
  },
})

export async function detectTimeguessr(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'timeguessr'
    return true
  } else return false
}
