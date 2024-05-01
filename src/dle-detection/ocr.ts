import * as child_process from 'child_process'

import type {Region, Sharp} from 'sharp'
import terminalImage from 'terminal-image'

export function recogniseText(image: Sharp, psm: number = 11, abortController?: AbortController) {
  let resolve: (value: string) => void
  const promise = new Promise<string>(res => resolve = res)
  // psm 11: Sparse text. Find as much text as possible in no particular order.
  const tesseractProcess = child_process.exec(
    `tesseract stdin - --psm ${psm} -l eng`, {
      timeout: 4000, // if it takes longer that means there is too much text to be a dle
      signal: abortController?.signal
    })
  let data = '', imageBuffer: Buffer = null!
  tesseractProcess.stderr?.on('data', () => 0)
  tesseractProcess.stdout?.on('data', (chunk: string) => data += chunk)
  tesseractProcess.on('close', () => resolve(data))
  tesseractProcess.stdin?.on('error', () => 0) // catch when process was aborted, but buffer still writing
  image.toBuffer()
    .then(buffer => {
      imageBuffer = buffer
      // terminalImage.buffer(buffer).then(console.log)
      tesseractProcess.stdin?.write(buffer)
      tesseractProcess.stdin?.end()
    })
  return promise
}

export function recogniseTextRects(image: Sharp, rects: Region[], psm: number = 11) {
  return Promise.all(
    rects.map(rectangle => {
      const cropped = image.clone().extract(rectangle)
      return recogniseText(cropped, psm)
    })
  )
}

export async function osd(image: Sharp) {
  // psm 0: Orientation and script detection (OSD) only.
  const textBuffer = child_process.execSync(
    `tesseract stdin - --psm 0 --oem 0`,
    {input: await image.toBuffer(), stdio: ['pipe', 'pipe', 'ignore']}
  )
  return textBuffer.toString('utf8')
}
