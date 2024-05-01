import {getDescriptors, matchFeature} from '../feature-matching.js'
import {findWithMaximumDistance, rectWidthHeightToSharpRect, simpleSearch} from './helpers.js'
import Frame, {consecutiveSpaceOrLineBreaks} from '../frame.js'
import {DetectFunctionsCharacteristic, TextLogicalOperation} from './types.js'
import {recogniseTextRects} from '../ocr.js'

export async function featureMatches(frame: Frame, feature: NonNullable<DetectFunctionsCharacteristic['features']>[number]) {
  const descriptors = feature.expectedPosition
    ? await getDescriptors(frame.imageSharpNoChat.clone().extract(rectWidthHeightToSharpRect(feature.expectedPosition)))
    : await frame.imageNoChatDes
  // @ts-ignore
  if (feature.log && !descriptors) console.log('No descriptors')
  if (!descriptors) return false
  const matches = await matchFeature(descriptors, feature.image)
  // @ts-ignore
  if (feature.log) console.log(matches)
  return matches >= feature.minMatches
}

export async function textMatches(frame: Frame,text: NonNullable<DetectFunctionsCharacteristic['text']>[number]) {
  // todo this smells like performance issues
  const rects = text.rects ? text.rects :
    (text.expectedPositionAsRect && text.expectedPosition ? [rectWidthHeightToSharpRect(text.expectedPosition)] : null)
  const detectedText = (rects
      ? (await recogniseTextRects(frame.imageSharpNoChat, rects, text.psm) as string[] /* why can you not infer, stupid ass typescript */)
        .map(s => s.replace(consecutiveSpaceOrLineBreaks, ' ').toLowerCase())
      : [await frame.recognisedText, await frame.recognisedInvertedText]
  ).filter(v => v) as string[]
  const isInText = text.maxDistance ? findWithMaximumDistance.bind(null, text.maxDistance) : simpleSearch
  // @ts-ignore
  if (text.log) console.log(detectedText)
  if (Array.isArray(text.string)) {
    if (!text.logicalOperation || text.logicalOperation === TextLogicalOperation.or) {
      const anyTextsMatch = text.string.some(string => detectedText.some(entry => isInText(entry, string)))
      if (!anyTextsMatch) return false
    } else if (text.logicalOperation === TextLogicalOperation.and) {
      const allTextsMatch = text.string.every(string => detectedText.some(entry => isInText(entry, string)))
      if (!allTextsMatch) return false
    }
  } else {
    if (!detectedText.some(entry => isInText(entry, text.string as string /* ???? i am so confused */))) return false
  }
  return true
}
