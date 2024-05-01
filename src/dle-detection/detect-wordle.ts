import type Frame from './frame.js'
import {getFeature} from './feature-matching.js'
import {getDetect} from './detection/detect.js'

const wordleLogoWhiteOnBlack = getFeature('wordle-logo-wob.png')
const wordleLogoBlackOnWhite = getFeature('wordle-logo-bow.png')

const detector = getDetect({
  welcome: {
    features: [{
      image: wordleLogoBlackOnWhite,
      minMatches: 30,
      expectedPosition: {x: 595, y: 445, width: 210, height: 65},
      textSize: {width: 200, height: 50},
    }],
    text: [{
      string: 'get 6 chances to guess a 5-letter word.',
      rects: [{left: 470, top: 535, width: 460, height: 120}],
      textSize: {width: 455, height: 100},
    },]
  },
  gameplay: {
    colors: [{
      values: [19, 19, 19],
      minRelativeCoverage: .6,
    },],
    features: [{
      image: wordleLogoWhiteOnBlack,
      minMatches: 30,
      expectedPosition: {x: 600, y: 80, width: 180, height: 560},
      textSize: {width: 130, height: 35},
    },],
  },
  /*score: {
    text: [{
      string: 'guess distribution',
      expectedPosition: {x: 440, y: 400, width: 300, height: 140},
      textSize: {width: 220, height: 16},
    }, {
      string: 'wordlebot gives an analysis of your guesses.',
      expectedPosition: {x: 470, y: 660, width: 460, height: 200},
      textSize: {width: 220, height: 16},
    },]
  },*/
  // ya, it's not a PAY-wall technically, but look, there are TWO of them o.o
  paywall: {
    text: [{
      string: 'you need one to track your stats online and in our apps',
      rects: [{left: 420, top: 90, width: 530, height: 540}],
      textSize: {width: 517, height: 80},
    }, {
      string: 'by continuing, you agree to the terms of sale, terms of service, and privacy policy',
      rects: [{left: 360, top: 580, width: 655, height: 485}],
      textSize: {width: 653, height: 53},
    },]
  },
  paywall2: {
    text: [{
      string: ['congratulations', 'thanks for playing today'],
      expectedPosition: {x: 475, y: 375, width: 425, height: 140},
      expectedPositionAsRect: true,
      textSize: {width: 380, height: 50},
    }, {
      string: 'wAnT tO sEe YoUr StAtS aNd StReAkS'.toLowerCase(),
      expectedPosition: {x: 505, y: 450, width: 370, height: 170},
    },]
  },
})

export async function detectWordle(frame: Frame): Promise<boolean> {
  if (await detector(frame)) {
    frame.detectedDle = 'wordle'
    return true
  } else return false
}
