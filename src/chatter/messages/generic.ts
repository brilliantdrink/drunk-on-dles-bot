// noinspection ES6PreferShortImport
import type {MessageComposeLevels} from '../messages/index.js'

export const messages: MessageComposeLevels = {
  better: [
    () => 'EZ Clap',
    () => 'damn bear elbySlay',
    () => 'shes cracked elbyPoggies',
    () => 'too EZ',
    () => 'LOCKIN',
    (score, game) => `elbyNerd elby you did this ${game.toLowerCase()} ${Math.abs(score.betterWorsePercentage * 100)}% better than usual`,
  ],
  typical: [
    () => 'EZ Clap',
    () => 'EZ',
    (score, game) => `elbow did the ${game.toLowerCase()} peepoClap`,
    (score, game) => `professional DLE strimmer did the ${game.toLowerCase()} professionally`,
  ],
  worse: [
    () => 'lb powering through elbyBuff',
  ],
  lost: [
    () => 'NotLikeThis',
    () => 'elbySadge',
  ],
}
