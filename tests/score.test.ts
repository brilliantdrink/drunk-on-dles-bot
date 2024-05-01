import {describe, it} from 'node:test'
import assert from 'node:assert'
import path from 'path'
import {screenshots} from './screenshots.js'
import Frame, {DLETypes} from '../src/dle-detection/frame.js'
import State from '../src/state.js'
import expectedScores from './expected-scores.json'


for (const gameToCheck in screenshots) {
  describe(`${gameToCheck} score collector`, () => {
    it(`should collect score correctly`, async () => {
      const gameScreenshots = screenshots[gameToCheck as keyof typeof screenshots]
      for (const view in gameScreenshots) {
        if (!gameScreenshots.hasOwnProperty(view)) continue
        const images = gameScreenshots[view as keyof typeof gameScreenshots]
        if (!images) continue
        for (const image of images) {
          const imageName = path.basename(image)
          if (!(imageName in expectedScores)) continue
          const state = new State()
          const frame = new Frame(image, (new Date()).valueOf())
          await frame.detectDlePre()
          frame.detectedDle = gameToCheck as DLETypes
          frame.view = view as Frame['view']
          await state.putFrame(frame)
          const expectedScore = expectedScores[imageName as keyof typeof expectedScores]
          assert.notEqual(state.score, null, `Detected no score for ${imageName}`)
          if (!state.score) throw new Error() // never
          for (const scoreComponentKey in expectedScore) {
            assert(scoreComponentKey in state.score, `Score for ${imageName} does not have ${scoreComponentKey}`)
            const actualValue = state.score[scoreComponentKey as keyof typeof state.score]
            const expectedValue = expectedScore[scoreComponentKey as keyof typeof expectedScore]
            assert.equal(actualValue, expectedValue, `${scoreComponentKey} does not match for ${imageName}; expected ${expectedValue}, got ${actualValue}`)
          }
        }
      }
    })
  })
}
