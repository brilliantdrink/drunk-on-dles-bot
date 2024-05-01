import type {Region} from 'sharp'
import type {RectWidthHeight} from '../text-localisation.js'
import {damerauLevenshteinDistance} from '../text-distance.js'

export function simpleSearch(source: string, target: string) {
  return source.includes(target)
}

export function findWithMaximumDistance(maxDistance: number, source: string, target: string) {
  const distance = damerauLevenshteinDistance(source, target)
  const additionalCharsAmount = source.length - target.length
  // console.log(additionalCharsAmount, distance, source.length)
  // console.log([source, target, distance - additionalCharsAmount, maxDistance])
  return distance - additionalCharsAmount <= maxDistance
}

export function rectWidthHeightToSharpRect(rect: RectWidthHeight): Region {
  return {top: rect.y, left: rect.x, width: rect.width, height: rect.height}
}
