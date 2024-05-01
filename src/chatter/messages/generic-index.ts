import {MessageComposeLevels, MessageComposer, NormalisedScore, ScoreWord} from './index.js'
import {messages as genericMessages} from './generic.js'
import {messages as timeMessages} from './time.js'
import {messages as guessesMessages} from './guesses.js'
import {messages as cumulativeMessages} from './cumulative.js'

export function getMessages(scoreWord: ScoreWord, gameType: NormalisedScore['type']) {
  const messagesGeneric = genericMessages[scoreWord]
  const messagesGameType = ({
      time: timeMessages,
      guesses: guessesMessages,
      cumulative: cumulativeMessages,
    } satisfies { [Type in NormalisedScore['type']]: MessageComposeLevels }
  )[gameType][scoreWord]
  return messagesGeneric.concat(messagesGameType)
}
