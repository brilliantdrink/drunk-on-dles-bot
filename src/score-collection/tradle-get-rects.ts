import * as path from 'path'

import {type Sharp} from 'sharp'

import {ETB, invokeWorker, US} from '../python.js'
import {distance} from './helpers.js'
import {projectDir} from '../dir.js'
import RectMatrix from './RectMatrix.js'
import terminalImage from 'terminal-image'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'tradle_get_rects.py')
const request = invokeWorker(pythonScriptPath)

export type TradleRect = {
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
  line: number,
  column: number,
}

export async function tradleGetRects(image: Sharp) {
  // const start = performance.now()
  const imageBuffer = await image.toBuffer()
  const response = await request(imageBuffer.toString('base64') + '\n')
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  const tradleRects: TradleRect[] = responseNoETB.trim()
    .split(US)
    .filter(rect => rect !== '')
    .map(rectString => {
      const [x, y, width, height, ...bgrColor] = rectString.split(',').map(n => Number(n))
      let color: Color = null!
      if (isEmpty(bgrColor as Vector3)) color = Color.White
      else if (isYellow(bgrColor as Vector3)) color = Color.Yellow
      else if (isGreen(bgrColor as Vector3)) color = Color.Green
      return {
        x, y, width, height, color,
        line: 0,
        column: 0,
      }
    })
  const matrix = new RectMatrix(tradleRects)

  // const end = performance.now()
  // console.debug(`Detected wordle rects in ${end - start}ms`)
  return matrix
}

type Vector3 = [number, number, number]

const colorMatchingThreshold = 50
const white: Vector3 = [195, 195, 195]
const yellow: Vector3 = [90, 198, 200]
const green: Vector3 = [71, 180, 65]

export enum Color {
  White = 'White',
  Yellow = 'Yellow',
  Green = 'Green'
}

const isEmpty = (color: Vector3) => distance(color, white) < colorMatchingThreshold
const isYellow = (color: Vector3) => distance(color, yellow) < colorMatchingThreshold
const isGreen = (color: Vector3) => distance(color, green) < colorMatchingThreshold
