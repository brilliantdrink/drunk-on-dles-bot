import {getFeature} from './feature-matching.js'
import Frame, {callAndRejectIfFalse} from './frame.js'
import {getDetect} from './detection/detect.js'
import {Vector3} from '../score-collection/helpers.js'

const tradleLogo = getFeature('tradle-logo.png')
const tradleTopOrnament = getFeature('tradle-top-ornament.png')
const tradleBottomOrnament = getFeature('tradle-bottom-ornament.png')
// const tradleIconsColor = getFeatures('travle-icons/color')
// const tradleIconsGray = getFeatures('travle-icons/gray')

const background: Vector3 = [246, 251, 253]
const backgroundDarkened: Vector3 = [70, 72, 72]
const backgroundPanel: Vector3 = [255, 255, 255]

const isTradleGameplayScreenScrolledUp = getDetect({
  gameplay: {
    features: [{
      image: tradleLogo,
      minMatches: 15,
    },],
    text: [{
      string: 'guess which country exports these products!',
    },],
  },
})
const isTradleGameplayScreenScrolledMiddle = getDetect({
  gameplay: {
    features: [{
      image: tradleTopOrnament,
      minMatches: 40,
    },],
  },
})
const isTradleGameplayScreenScrolledDown = getDetect({
  gameplay: {
    features: [{
      image: tradleBottomOrnament,
      minMatches: 40,
    },],
  },
})

const detector = getDetect({
  score: {
    colors: [{
      values: backgroundDarkened,
      maxDistance: 10,
      minRelativeCoverage: .25,
    }, {
      values: backgroundPanel,
      maxDistance: 10,
      minRelativeCoverage: .2,
    },],
    text: [{
      string: ['congratulations!', 'try again next time'],
      expectedPosition: {y: 250, x: 500, width: 400, height: 100},
      expectedPositionAsRect: true,
      textSize: {width: 340, height: 31},
      minTextSizeCoverage: .9,
    }, {
      string: 'tradle',
      rects: [{top: 340, left: 640, width: 110, height: 90}],
    },],
  },
  gameplay: {
    colors: [{
      values: background,
      maxDistance: 10,
      minRelativeCoverage: .25,
    },],
    scripts: [{
      check(frame: Frame) {
        return Promise.any(
          [isTradleGameplayScreenScrolledUp, isTradleGameplayScreenScrolledMiddle, isTradleGameplayScreenScrolledDown]
            .map(detectDle => callAndRejectIfFalse(detectDle, frame))
        ).then(() => true).catch(() => false)
      }
    },],
  },
})

export async function detectTradle(frame: Frame) {
  if (await detector(frame)) {
    frame.detectedDle = 'tradle'
    return true
  } else return false
}

/*async function isTradleGameplayScreenScrolledMiddle(frame: Frame): Promise<boolean> {
  const matchTradleIconsPromises = []
  let matchesTradleIconsColor = 0
  for (const tradleIconsColorKey in tradleIconsColor) {
    if (!tradleIconsColor.hasOwnProperty(tradleIconsColorKey)) continue
    const icon = tradleIconsColor[tradleIconsColorKey]
    matchTradleIconsPromises.push(
      matchFeature(frame.imageNoChatDes, icon).then(res => matchesTradleIconsColor += res)
    )
  }
  let matchesTradleIconsGray = 0
  for (const tradleIconsGrayKey in tradleIconsGray) {
    if (!tradleIconsGray.hasOwnProperty(tradleIconsGrayKey)) continue
    const icon = tradleIconsGray[tradleIconsGrayKey]
    matchTradleIconsPromises.push(
      matchFeature(frame.imageNoChatDes, icon).then(res => matchesTradleIconsGray += res)
    )
  }
  await Promise.allSettled(matchTradleIconsPromises)
  // don't turn this one way down. 130 just about does not create false positives
  return Boolean(matchesTradleIconsColor + matchesTradleIconsGray > 150)
}*/
