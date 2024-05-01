import * as fs from 'fs'
import path from 'path'
import type {DLETypes} from '../src/dle-detection/frame.js'

type Views = 'welcome' | 'gameplay' | 'round' | 'score' | 'paywall' | 'paywall2'
const screenshotsDir = path.resolve('tests', 'screenshots')
export const screenshots: Partial<{ [Game in DLETypes]: Partial<{ [View in Views]: string[] }> }> = Object.fromEntries(
  fs.readdirSync(screenshotsDir)
    .filter(gameDir => fs.statSync(path.join(screenshotsDir, gameDir)).isDirectory())
    .map(gameDir => [
      gameDir as DLETypes,
      Object.fromEntries(
        fs.readdirSync(path.join(screenshotsDir, gameDir))
          .filter(viewDir => fs.statSync(path.join(screenshotsDir, gameDir, viewDir)).isDirectory())
          .map(viewDir => [
            viewDir as Views,
            fs.readdirSync(path.join(screenshotsDir, gameDir, viewDir))
              .filter(imageName => imageName.endsWith('.png'))
              .map(imageName =>
                path.resolve(screenshotsDir, gameDir, viewDir, imageName)
              )
          ])
      )
    ])
)
