import * as path from 'path'

import {type Sharp} from 'sharp'

import {ETB, invokeWorker, US} from '../python.js'
import {distance} from './helpers.js'
import {projectDir} from '../dir.js'
import RectMatrix from './RectMatrix.js'
import terminalImage from 'terminal-image'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'wordle_get_rects.py')
const request = invokeWorker(pythonScriptPath)

export type WordleRect = {
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
  line: number,
  column: number,
}

export async function wordleGetRects(image: Sharp) {
  // const start = performance.now()
  const imageBuffer = await image.toBuffer()
  const response = await request(imageBuffer.toString('base64') + '\n')
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  const wordleRects: WordleRect[] = responseNoETB.trim()
    .split(US)
    .filter(rect => rect !== '')
    .map(rectString => {
      const [x, y, width, height, ...bgrColor] = rectString.split(',').map(n => Number(n))
      let color: Color = null!
      if (isEmpty(bgrColor as Vector3)) color = Color.DarkGray
      else if (isGray(bgrColor as Vector3)) color = Color.Gray
      else if (isYellow(bgrColor as Vector3)) color = Color.Yellow
      else if (isGreen(bgrColor as Vector3)) color = Color.Green
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

const colorMatchingThreshold = 50
const darkGray: Vector3 = [24, 24, 24]
const gray: Vector3 = [78, 78, 78]
const yellow: Vector3 = [98, 174, 190]
const green: Vector3 = [108, 158, 110]

export enum Color {
  DarkGray = 'DarkGray',
  Gray = 'Gray',
  Yellow = 'Yellow',
  Green = 'Green'
}

const isEmpty = (color: Vector3) => distance(color, darkGray) < colorMatchingThreshold
const isGray = (color: Vector3) => distance(color, gray) < colorMatchingThreshold
const isYellow = (color: Vector3) => distance(color, yellow) < colorMatchingThreshold
const isGreen = (color: Vector3) => distance(color, green) < colorMatchingThreshold
