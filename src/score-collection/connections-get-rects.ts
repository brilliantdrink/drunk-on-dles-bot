import * as path from 'path'

import {type Sharp} from 'sharp'

import {ETB, invokeWorker, US} from '../python.js'
import {distance} from './helpers.js'
import {projectDir} from '../dir.js'
import RectMatrix from './RectMatrix.js'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'connections_get_rects.py')
const request = invokeWorker(pythonScriptPath)

export type ConnectionsRect = {
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
  line: number,
  column: number,
}

export async function connectionsGetRects(image: Sharp) {
  // const start = performance.now()
  const imageBuffer = await image.toBuffer()
  const response = await request(imageBuffer.toString('base64') + '\n')
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  const wordleRects: ConnectionsRect[] = responseNoETB.trim()
    .split(US)
    .filter(rect => rect !== '')
    .map(rectString => {
      const [x, y, width, height, ...bgrColor] = rectString.split(',').map(n => Number(n))
      let color: Color = null!
      if (isYellow(bgrColor as Vector3)) color = Color.Yellow
      else if (isGreen(bgrColor as Vector3)) color = Color.Green
      else if (isBlue(bgrColor as Vector3)) color = Color.Blue
      else if (isPurple(bgrColor as Vector3)) color = Color.Purple
      return {
        x, y, width, height, color,
        line: 0,
        column: 0,
      }
    })
  const matrix = new RectMatrix(wordleRects)

  // const end = performance.now()
  // console.debug(`Detected wordle rects in ${end - start}ms`)
  return matrix
}

type Vector3 = [number, number, number]

const colorMatchingThreshold = 30
const yellow: Vector3 = [139, 227, 248]
const green: Vector3 = [119, 202, 174]
const blue: Vector3 = [237, 205, 189]
const purple: Vector3 = [202, 149, 196]

export enum Color {
  Yellow = 'Yellow',
  Green = 'Green',
  Blue = 'Blue',
  Purple = 'Purple',
}

const isYellow = (color: Vector3) => distance(color, yellow) < colorMatchingThreshold
const isGreen = (color: Vector3) => distance(color, green) < colorMatchingThreshold
const isBlue = (color: Vector3) => distance(color, blue) < colorMatchingThreshold
const isPurple = (color: Vector3) => distance(color, purple) < colorMatchingThreshold
