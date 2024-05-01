import {type RectWidthHeight} from '../text-localisation.js'
import Frame from '../frame.js'
import {DetectFunctionsCharacteristic, DetectFunctionsCharacteristics} from './types.js'
import {createEitherOfs, iterateCharacteristicType} from './iteration.js'
import {featureMatches, textMatches} from './main-checks.js'
import {allColorsPlausible, allFeaturesPlausible, allTextPlausible} from './plausability.js'

export function getDetect(characteristics: DetectFunctionsCharacteristics) {
  const storage: Record<string, any> = {}
  const expectsTextRects: { [Key in keyof typeof characteristics]: boolean } = {}

  storage.hasPlausibilityCheck = []
  for (const isScore in characteristics) {
    if (!characteristics.hasOwnProperty(isScore)) continue
    const characteristic = characteristics[isScore as keyof typeof characteristics]
    if (!characteristic) continue

    const hasColorPlausibility = characteristic.colors && characteristic.colors.length > 0

    const hasFeaturesPlausibility = characteristic.features && characteristic.features
      .some(feature => 'expectedPosition' in feature && feature.expectedPosition !== undefined)
    const hasAllFeaturesPlausibility = characteristic.features && characteristic.features
      .every(feature => 'expectedPosition' in feature && feature.expectedPosition !== undefined)

    const hasTextPlausibility = characteristic.text && characteristic.text
      .some(text => 'expectedPosition' in text && text.expectedPosition !== undefined)
    const hasAllTextPlausibility = characteristic.text && characteristic.text
      .every(text => 'expectedPosition' in text && text.expectedPosition !== undefined)

    storage.hasPlausibilityCheck[isScore] = hasColorPlausibility || hasFeaturesPlausibility || hasTextPlausibility
    if (!storage.hasPlausibilityCheck[isScore])
      console.warn(`No plausibility checks (${isScore})`)
    else if (!hasColorPlausibility && !hasAllFeaturesPlausibility && !hasAllTextPlausibility)
      console.warn(`Not all have plausibility checks (${isScore})`)

    expectsTextRects[isScore as keyof typeof characteristics] ??= false
    expectsTextRects[isScore as keyof typeof characteristics] ||= hasTextPlausibility
    expectsTextRects[isScore as keyof typeof characteristics] ||= hasTextPlausibility
  }

  return async function detect(frame: Frame) {
    // plausibility checks
    storage.featuresPositions = new Map() as Map<NonNullable<DetectFunctionsCharacteristic['features']>[number], RectWidthHeight>

    // todo: parallelize
    for (const isScore in characteristics) {
      if (!characteristics.hasOwnProperty(isScore)) continue
      const characteristic = characteristics[isScore as keyof typeof characteristics]
      if (!characteristic) continue

      if (storage.hasPlausibilityCheck[isScore]) {
        const [eitherOfsPlausibility, eitherOfPlausibilityIndexMap] = createEitherOfs(characteristic)

        const allColorsArePlausible = await iterateCharacteristicType(
          characteristic, 'colors',
          allColorsPlausible.bind(null, frame),
          eitherOfsPlausibility, eitherOfPlausibilityIndexMap
        )
        if (!allColorsArePlausible) continue

        const frameTextRects = await frame.textRects
        if (expectsTextRects[isScore as keyof typeof characteristics] && (!frameTextRects || frameTextRects.length === 0)) return false
        const textRects = frameTextRects as RectWidthHeight[]

        const allFeaturesArePlausible = await iterateCharacteristicType(
          characteristic, 'features',
          allFeaturesPlausible.bind(null, textRects, storage.featuresPositions),
          eitherOfsPlausibility, eitherOfPlausibilityIndexMap
        )
        if (!allFeaturesArePlausible) continue

        const allTextIsPlausible = await iterateCharacteristicType(
          characteristic, 'text',
          allTextPlausible.bind(null, frame, textRects),
          eitherOfsPlausibility, eitherOfPlausibilityIndexMap
        )
        if (!allTextIsPlausible) continue
      }

      const [eitherOfsMain, eitherOfMainIndexMap] = createEitherOfs(characteristic)

      const allFeaturesMatch = await iterateCharacteristicType(
        characteristic, 'features',
        featureMatches.bind(null, frame),
        eitherOfsMain, eitherOfMainIndexMap
      )
      if (!allFeaturesMatch) continue

      const allTextMatch = await iterateCharacteristicType(
        characteristic, 'text',
        textMatches.bind(null, frame),
        eitherOfsMain, eitherOfMainIndexMap
      )
      if (!allTextMatch) continue

      const allScriptsMatch = await iterateCharacteristicType(
        characteristic, 'scripts',
        async script => await script.check(frame),
        eitherOfsMain, eitherOfMainIndexMap
      )
      if (!allScriptsMatch) continue

      frame.view = isScore as Frame['view'] // ?????? ass
      return true
    }
    return false
  }
}
