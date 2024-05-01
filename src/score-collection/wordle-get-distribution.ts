import * as path from 'path'

import {type Sharp} from 'sharp'
import {ETB, invokeWorker} from '../python.js'
import {projectDir} from '../dir.js'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'wordle_get_distribution.py')
const request = invokeWorker(pythonScriptPath)

export async function wordleGetDistribution(image: Sharp) {
  const imageBuffer = await image.toBuffer()
  const response = await request(imageBuffer.toString('base64') + '\n')
  const responseNoETB = response.endsWith(ETB) ? response.substring(0, response.length - 1) : response
  return responseNoETB.trim()
    .split('\x1f')
    .filter(rect => rect !== '')
    .map(bar => {
      const [x, y, width, height, ...bgrColor] = bar.split(',').map(n => Number(n))
      return {x, y, width, height, bgrColor}
    })
}
