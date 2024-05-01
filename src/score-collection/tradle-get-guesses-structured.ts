import * as path from 'path'

import {Region, type Sharp} from 'sharp'
import {ETB, invokeWorker} from '../python.js'
import {projectDir} from '../dir.js'
import RectMatrix, {Rect} from './RectMatrix.js'
import {recogniseTextRects} from '../dle-detection/ocr.js'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'tradle_get_guesses_structured.py')
const request = invokeWorker(pythonScriptPath)

export async function tradleGetGuessesStructured(image: Sharp) {
  const imageBuffer = await image.toBuffer()
  const response = await request(imageBuffer.toString('base64') + '\n')
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  const rects = responseNoETB.trim()
    .split('\x1f')
    .filter(rect => rect !== '')
    .map(bar => {
      const [x, y, width, height] = bar.split(',').map(n => Number(n))
      return {x, y, width, height, line: 0, column: 0} as Rect
    })
  const matrix = new RectMatrix(rects)
  const guessesStructured = await Promise.all(
    matrix.matrix.map(row => {
      const rects: (Partial<Rect & Region>)[] = row
      for (const rect of rects) {
        rect.left = rect.x
        rect.top = rect.y
      }
      return recogniseTextRects(image, row as unknown as Region[], 7)
    })
  )
  return guessesStructured
}
