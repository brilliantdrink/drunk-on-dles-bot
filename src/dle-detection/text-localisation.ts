import * as path from 'path'

import {type Sharp} from 'sharp'
import {ETB, invokeWorker, US} from '../python.js'
import {projectDir} from '../dir.js'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'text_localisation.py')
const request = invokeWorker(pythonScriptPath, true)

export async function localiseText(image: Sharp, confidence: number = .2) {
  // const start = performance.now()
  const imageBuffer = await image.toBuffer()
  // const toBuffer = performance.now()
  // this takes long for whatever reason (responseTime - toBuffer ≈ 600 to 800 ms; inside ~ 140 ms)
  const response = await request(`${imageBuffer.toString('base64')}${US}${confidence}\n`, true)
  // const responseTime = performance.now()
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  const rects = responseNoETB.split(US)
    .filter(rect => rect !== '')
    .map(rectString => {
      const [x, y, width, height] = rectString.split(',').map(n => Number(n))
      return {x, y, width, height} as RectWidthHeight
    })

  // const end = performance.now()
  // console.debug(`Matched pattern in ${end - start}ms`)
  // console.debug(`Buffer in ${toBuffer - start}ms`)
  // console.debug(`Response in ${responseTime - toBuffer}ms`)
  return rects
}

export type RectWidthHeight = {
  x: number,
  y: number,
  width: number,
  height: number,
}

type RectStartEnd = {
  x: number,
  y: number,
  x2: number,
  y2: number,
}

function getLargestOf<A, B>(target: A, tests: B[], predicate: (a: A, b: B) => number, returnTested: true): [number, B | null]
function getLargestOf<A, B>(target: A, tests: B[], predicate: (a: A, b: B) => number, returnTested?: false): number
function getLargestOf<A, B>(target: A, tests: B[], predicate: (a: A, b: B) => number, returnTested?: boolean) {
  let largest = 0, correspondingTest = null
  for (const test of tests) {
    const value = predicate(target, test)
    if (value > largest) {
      largest = value
      correspondingTest = test
    }
  }
  if (returnTested) return [largest, correspondingTest] as [number, B | null]
  else return largest
}

export function getLargestRelativeIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect: true): [number, RectWidthHeight]
export function getLargestRelativeIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect?: false): number
export function getLargestRelativeIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect?: boolean): number | [number, RectWidthHeight] {
  // @ts-ignore
  return getLargestOf(target, rects, ratioOfIntersection, returnRect)
}

export function getLargestAbsoluteIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect: true): [number, RectWidthHeight]
export function getLargestAbsoluteIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect?: false): number
export function getLargestAbsoluteIntersection(target: RectWidthHeight, rects: RectWidthHeight[], returnRect?: boolean): number | [number, RectWidthHeight] {
  // @ts-ignore typescript is bullying me :´(
  return getLargestOf(target, rects, areaOfIntersection, !!returnRect)
}

export function ratioOfIntersection(a: RectWidthHeight | RectStartEnd, b: RectWidthHeight | RectStartEnd) {
  a = rectToRectWidthHeight(a)
  b = rectToRectWidthHeight(b)
  const areaIntersection = areaOfIntersection(a, b)
  const areaA = a.width * a.height
  const areaB = b.width * b.height
  const areaUnion = (areaA + areaB) - areaIntersection
  return areaIntersection / areaUnion
}

export function areaOfIntersection(a: RectWidthHeight | RectStartEnd, b: RectWidthHeight | RectStartEnd) {
  a = rectToRectStartEnd(a)
  b = rectToRectStartEnd(b)
  // always the innermost point
  const intersection = rectToRectWidthHeight({
    x: Math.max(a.x, b.x),
    x2: Math.min(a.x2, b.x2),
    y: Math.max(a.y, b.y),
    y2: Math.min(a.y2, b.y2),
  })
  return Math.max(0, intersection.width) * Math.max(0, intersection.height)
}

function rectToRectWidthHeight(rect: RectWidthHeight | RectStartEnd) {
  return {
    x: rect.x,
    y: rect.y,
    width: 'width' in rect ? rect.width : (rect.x2 - rect.x),
    height: 'height' in rect ? rect.height : (rect.y2 - rect.y),
  }
}

function rectToRectStartEnd(rect: RectWidthHeight | RectStartEnd) {
  return {
    x: rect.x,
    y: rect.y,
    x2: 'x2' in rect ? rect.x2 : (rect.x + rect.width),
    y2: 'y2' in rect ? rect.x2 : (rect.y + rect.height),
  }
}
