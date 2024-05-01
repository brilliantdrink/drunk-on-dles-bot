import {DetectFunctionsCharacteristic, EitherOf, EitherOfIndexMap} from './types.js'

export function createEitherOfs(characteristic: DetectFunctionsCharacteristic): [EitherOf, EitherOfIndexMap] {
  const eitherOfs: EitherOf = {}
  const eitherOfIndexMap: EitherOfIndexMap = new Map()
  for (const entry of Object.values(characteristic).flat()) {
    if (!entry.eitherOfKey) continue
    eitherOfs[entry.eitherOfKey] ??= []
    eitherOfIndexMap.set(entry, eitherOfs[entry.eitherOfKey].length)
    eitherOfs[entry.eitherOfKey].push(null)
  }
  return [eitherOfs, eitherOfIndexMap]
}

export function shouldContinueCharacteristicsLoop(eitherOfKey: string | undefined, eitherOfs: EitherOf) {
  if (eitherOfKey)
    // if it only includes false, that means all checks in group failed, -> act as if standalone check failed
    return !eitherOfs[eitherOfKey].includes(true) && !eitherOfs[eitherOfKey].includes(null)
  else return true
}

export async function iterateCharacteristicType<Type extends keyof DetectFunctionsCharacteristic>(
  characteristic: DetectFunctionsCharacteristic,
  type: Type,
  callback: (entry: NonNullable<DetectFunctionsCharacteristic[Type]>[number]) => Promise<boolean>,
  eitherOfs: EitherOf,
  eitherOfIndexMap: EitherOfIndexMap,
): Promise<boolean> {
  const entries = characteristic[type]
  if (!entries) return true
  // todo: parallelize
  for (const entry of entries) {
    if (entry.eitherOfKey && eitherOfs[entry.eitherOfKey].includes(true)) continue
    const eitherOfIndex = eitherOfIndexMap.get(entry as NonNullable<DetectFunctionsCharacteristic[Type]>[number]) as number
    if (entry.eitherOfKey) eitherOfs[entry.eitherOfKey][eitherOfIndex] = false

    const matches = await callback(entry as NonNullable<DetectFunctionsCharacteristic[Type]>[number])
    if (!matches) {
      if (!shouldContinueCharacteristicsLoop(entry.eitherOfKey, eitherOfs)) continue // continue this loop
      else return false // continue outside loop
    }

    if (entry.eitherOfKey) eitherOfs[entry.eitherOfKey][eitherOfIndex] = true
  }
  return true // don't continue loop, just keep going in the iteration
}
