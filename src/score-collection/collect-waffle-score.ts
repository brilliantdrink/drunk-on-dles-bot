import Frame, {consecutiveSpaceOrLineBreaks} from '../dle-detection/frame.js'
import type State from '../state.js'
import {waffleLostCheers, waffleWonCheers} from '../dle-detection/detect-waffle.js'
import {recogniseText} from '../dle-detection/ocr.js'
// import {waffleGetRects} from './waffle-get-rects.js'

const matchMovesRemaining = /(\d{1,2}) swaps? remaining/

const MAX_MOVES = 15

export async function collectWaffleScore(frame: Frame, state: State): Promise<{
  hasWon: boolean | null,
  guesses: number | null
}> {
  // const jazz = await waffleGetRects(frame.imageSharpNoChat)
  const image = frame.imageSharpNoChat.clone()
    .extract({left: 240, width: 920, top: 840, height: 140})
    .extractChannel('red')
  const recognisedText = (await recogniseText(image, 7)).replace(consecutiveSpaceOrLineBreaks, ' ').toLowerCase()
  const movesStringMatch = (await frame.recognisedInvertedText)?.match(matchMovesRemaining)
  const matchesWonCheer = waffleWonCheers.some(s => recognisedText?.includes(s))
  const matchesLostCheer = waffleLostCheers.some(s => recognisedText?.includes(s))
  return {
    hasWon: matchesWonCheer ? true : (matchesLostCheer ? false : null),
    guesses: movesStringMatch ? MAX_MOVES - Number(movesStringMatch[1]) : null
  }
}
