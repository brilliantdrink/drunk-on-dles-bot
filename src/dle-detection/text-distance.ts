// https://gist.github.com/IceCreamYou/8396172

export function damerauLevenshteinDistance(source: string, target: string) {
  if (!source) return target ? target.length : 0
  else if (!target) return source.length

  const sourceLength = source.length,
    targetLength = target.length,
    bothLength = sourceLength + targetLength,
    score: Array<Array<number>> = new Array(sourceLength + 2),
    sd: Record<string, number> = {}
  for (let i = 0; i < score.length; i++) score[i] = new Array(targetLength + 2)
  score[0][0] = bothLength
  for (let i = 0; i <= sourceLength; i++) {
    score[i + 1][1] = i
    score[i + 1][0] = bothLength
    sd[source[i]] = 0
  }
  for (let j = 0; j <= targetLength; j++) {
    score[1][j + 1] = j
    score[0][j + 1] = bothLength
    sd[target[j]] = 0
  }

  for (let i = 1; i <= sourceLength; i++) {
    let DB = 0
    for (let j = 1; j <= targetLength; j++) {
      const i1 = sd[target[j - 1]],
        j1 = DB
      if (source[i - 1] === target[j - 1]) {
        score[i + 1][j + 1] = score[i][j]
        DB = j
      } else {
        score[i + 1][j + 1] = Math.min(score[i][j], score[i + 1][j], score[i][j + 1]) + 1
      }
      score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity)
    }
    sd[source[i - 1]] = i
  }
  return score[sourceLength + 1][targetLength + 1]
}
