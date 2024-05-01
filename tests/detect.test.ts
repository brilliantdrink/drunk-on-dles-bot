import {after, describe, it} from 'node:test'
import assert from 'node:assert'
import path from 'path'
import {screenshots} from './screenshots.js'
import Frame, {dleDetectors, DLETypes} from '../src/dle-detection/frame.js'
import * as fs from 'fs'

// detector game -> image game -> image view -> performances
const perf: Record<string, Record<string, Record<string, Frame['perf'][]>>> = {}
type KeyOfMap<M extends Map<unknown, unknown>> = M extends Map<infer K, unknown> ? K : never

const only: DLETypes | null = null

for (const gameToCheck in screenshots) {
  if (!!only && gameToCheck !== only) continue
  const detectDLE = dleDetectors[gameToCheck as keyof typeof dleDetectors]

  describe(`${gameToCheck} detector`, () => {
    if (process.env.SAVE_PERF === '1')
      after(() => {
        if (!only && !Object.keys(screenshots).every(game => Object.keys(perf).includes(game))) return
        const fileName = only ? `detect-perf-${only}.json` : 'detect-perf.json'
        fs.writeFileSync(fileName, JSON.stringify(perf), 'utf8')
      })

    it(`should detect ${gameToCheck} correctly`, async () => {
      const gameScreenshots = screenshots[gameToCheck as keyof typeof screenshots]
      for (const view in gameScreenshots) {
        if (!gameScreenshots.hasOwnProperty(view)) continue
        const images = gameScreenshots[view as keyof typeof gameScreenshots]
        if (!images) continue
        for (const image of images) {
          const frame = new Frame(image, (new Date()).valueOf())
          const start = performance.now()
          await frame.detectDlePre()
          const startDetector = performance.now()
          const isWordle = await detectDLE(frame)
          frame.perf.detectors = performance.now() - startDetector
          frame.perf.dleDetection = performance.now() - start
          frame.cancelableProcessesController.abort()
          assert.equal(isWordle, true, `Did not detect ${path.basename(image)} as ${gameToCheck} (${view})`)
          if (frame.view === 'paywall2') frame.view = 'paywall'
          assert.equal(frame.view, view, `Did detect ${path.basename(image)} as ${gameToCheck}, but as ${frame.view} instead of ${view}`)
          perf[gameToCheck] ??= {}
          perf[gameToCheck][gameToCheck] ??= {}
          perf[gameToCheck][gameToCheck][view] ??= []
          perf[gameToCheck][gameToCheck][view].push(frame.perf)
        }
      }
    })

    for (const game in screenshots) {
      if (!screenshots.hasOwnProperty(game) || game === gameToCheck) continue
      it(`should not detect ${game} as ${gameToCheck}`, async () => {
        const views = screenshots[game as keyof typeof screenshots]
        for (const view in views) {
          if (!views.hasOwnProperty(view)) continue
          const images = views[view as keyof typeof views]
          if (!images) continue
          for (const image of images) {
            const frame = new Frame(image, (new Date()).valueOf())
            const start = performance.now()
            await frame.detectDlePre()
            const startDetector = performance.now()
            const isWordle = await detectDLE(frame)
            frame.perf.detectors = performance.now() - startDetector
            frame.perf.dleDetection = performance.now() - start
            frame.cancelableProcessesController.abort()
            assert.equal(isWordle, false, `Detected ${path.basename(image)} (${game}; ${view}) as ${gameToCheck} (${frame.view})`)
            perf[gameToCheck] ??= {}
            perf[gameToCheck][game] ??= {}
            perf[gameToCheck][game][view] ??= []
            perf[gameToCheck][game][view].push(frame.perf)
          }
        }
      })
    }
  })

}
