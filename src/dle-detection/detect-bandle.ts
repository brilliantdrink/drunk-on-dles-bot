import {getFeature, matchFeature} from './feature-matching.js'
import type Frame from './frame.js'

/*const bandleLogo = getFeature('bandle-logo.png')
const bandlePause = getFeature('bandle-pause.png')
const bandlePlay = getFeature('bandle-play.png')
const bandleScorePlay = getFeature('bandle-score-play.png')
const bandleSkipGuess = getFeature('bandle-skip-guess.png')
const bandleHeaderDimmed = getFeature('bandle-header-dimmed.png')*/

export async function detectBandle(frame: Frame) {
  /*if (await isBandleGameplayScreen(frame)) {
    frame.detectedDle = 'bandle'
    return true
  } else if (await isBandleScoreScreen(frame)) {
    frame.detectedDle = 'bandle'
    frame.isScoreBoard = true
    return true
  }
  return false*/
}

/*async function isBandleGameplayScreen(frame: Frame): Promise<boolean> {
  const textIncludesPrompt = frame.recognisedText?.includes('guess the song played by the band')
  const [matchesLogo, matchesBandlePause, matchesBandlePlay, matchesBandleSkipGuess] = await Promise.all([
    matchFeature(frame.imageNoChatDes, bandleLogo),
    matchFeature(frame.imageNoChatDes, bandlePause),
    matchFeature(frame.imageNoChatDes, bandlePlay),
    matchFeature(frame.imageNoChatDes, bandleSkipGuess),
  ])
  return Boolean((matchesLogo > 30 && textIncludesPrompt) || matchesBandleSkipGuess > 30 || matchesBandlePause + matchesBandlePlay > 10)
}*/

/*async function isBandleScoreScreen(frame: Frame): Promise<boolean> {
  const matchesBandleScorePlay = await matchFeature(frame.imageNoChatDes, bandleScorePlay)
  const textIncludesYouWinLose = frame.recognisedText?.includes('you got it') || frame.recognisedText?.includes('better luck tomorrow')
  const textIncludesSolution = frame.recognisedText?.includes('today\'s song was:')
  const textIncludesNextDleTimer = frame.recognisedText?.includes('next bandle in')
  const textIncludesPrompt = frame.recognisedText?.includes('guess the song played by the band') // this is correct
  return Boolean((matchesBandleScorePlay >= 5 || textIncludesNextDleTimer || textIncludesPrompt) && textIncludesSolution && textIncludesYouWinLose)
}*/
