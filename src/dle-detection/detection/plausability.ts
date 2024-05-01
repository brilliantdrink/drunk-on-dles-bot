import {getColorAmountRelative} from '../analyze-color.js'
import {DetectFunctionsCharacteristic} from './types.js'
import Frame from '../frame.js'
import {getLargestAbsoluteIntersection, RectWidthHeight} from '../text-localisation.js'
import terminalImage from 'terminal-image'
import {rectWidthHeightToSharpRect} from './helpers.js'

export async function allColorsPlausible(frame: Frame, color: NonNullable<DetectFunctionsCharacteristic['colors']>[number]) {
  const relativeAmount = await getColorAmountRelative(frame.imageSharpNoChat, color.values, color.maxDistance)
  // @ts-ignore
  if (color.log) console.log(relativeAmount)
  if (color.minRelativeCoverage && relativeAmount < color.minRelativeCoverage) return false
  if (color.maxRelativeCoverage && relativeAmount > color.maxRelativeCoverage) return false
  return true
}

export async function allFeaturesPlausible(
  textRects: RectWidthHeight[],
  featuresPositionsStorage: Map<typeof feature, RectWidthHeight>,
  feature: NonNullable<DetectFunctionsCharacteristic['features']>[number]
) {
  if (
    !('expectedPosition' in feature && feature.expectedPosition !== undefined) ||
    !('textSize' in feature && feature.textSize !== undefined)
  ) return true
  const [largestIntersectionArea, textArea] = getLargestAbsoluteIntersection(feature.expectedPosition, textRects, true)
  const textAreaSize = feature.textSize.height * feature.textSize.width
  // @ts-ignore
  if (feature.log) console.log(largestIntersectionArea, textAreaSize)
  if (largestIntersectionArea < textAreaSize) return false
  featuresPositionsStorage.set(feature, textArea)
  return true
}

export async function allTextPlausible(frame: Frame, textRects: RectWidthHeight[], text: NonNullable<DetectFunctionsCharacteristic['text']>[number]) {
  if (
    !('expectedPosition' in text && text.expectedPosition !== undefined) ||
    !('textSize' in text && text.textSize !== undefined)
  ) return true
  const [largestIntersectionArea, textArea] = getLargestAbsoluteIntersection(text.expectedPosition, textRects, true)
  // console.log(await terminalImage.buffer(await frame.imageSharpNoChat.clone().extract(rectWidthHeightToSharpRect(textArea)).toBuffer()))
  const textAreaSize = text.textSize.height * text.textSize.width
  // @ts-ignore
  if (text.log) console.log(largestIntersectionArea, textAreaSize)
  const minTextSizeCoverage = 'minTextSizeCoverage' in text && text.minTextSizeCoverage ? text.minTextSizeCoverage : 1
  if (largestIntersectionArea < textAreaSize * minTextSizeCoverage) return false
  return true
}
