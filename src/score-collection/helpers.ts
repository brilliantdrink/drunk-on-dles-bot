export type Vector3 = [number, number, number]

export function distance(vecA: Vector3, vecB: Vector3): number {
  return distanceSingleValues(vecA[0], vecA[1], vecA[2], vecB[0], vecB[1], vecB[2])
}

export function distanceSingleValues(vecA0: number, vecA1: number, vecA2: number, vecB0: number, vecB1: number, vecB2: number): number {
  return Math.sqrt((vecB0 - vecA0) ** 2 + (vecB1 - vecA1) ** 2 + (vecB2 - vecA2) ** 2)
}

export function mapRange(number: number, in_min: number, in_max: number, out_min: number = 0, out_max: number = 1) {
  return (number - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

export function roundToDecimal(number: number, decimal: number = 2) {
  return Math.round(number * 10 ** decimal) / 10 ** decimal
}
