import sharp, {OutputInfo, Sharp} from 'sharp'
import {distance, distanceSingleValues, Vector3} from '../score-collection/helpers.js'
import terminalImage from 'terminal-image'

const colorAmountsCache: WeakMap<Sharp, Map<Vector3, number>> = new WeakMap()
const imageInfoCache: WeakMap<Sharp, OutputInfo> = new WeakMap()
const imageRawBufferCache: WeakMap<Sharp, { data: Buffer, info: OutputInfo }> = new WeakMap()

export async function getColorAmount(image: Sharp, color: Vector3, maxDistance: number = 20) {
  if (!colorAmountsCache.has(image)) colorAmountsCache.set(image, new Map())
  let colorAmount = colorAmountsCache.get(image)?.get(color)
  if (colorAmount) return colorAmount

  let rawBuffer = imageRawBufferCache.get(image)
  if (!rawBuffer) {
    rawBuffer = await image.clone().raw().toBuffer({resolveWithObject: true})
    imageRawBufferCache.set(image, rawBuffer)
  }
  const {data, info} = rawBuffer
  let pixelsAmount = 0
  const color0 = color[0], color1 = color[1], color2 = color[2]
  for (let i = 0; i < data.length; i += info.channels) {
    if (distanceSingleValues(data[i], data[i + 1], data[i + 2], color0, color1, color2) < maxDistance) pixelsAmount++
  }
  colorAmountsCache.get(image)?.set(color, pixelsAmount)
  return pixelsAmount
}

export async function getColorAmountRelative(image: Sharp, color: Vector3, maxDistance: number = 20) {
  let info = imageInfoCache.get(image)
  if (!info) {
    ({info} = await image.clone().toBuffer({resolveWithObject: true}))
    imageInfoCache.set(image, info)
  }
  const totalPixelAmount = info.height * info.width
  return await getColorAmount(image, color, maxDistance) / totalPixelAmount
}
