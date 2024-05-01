import type {Region, Sharp} from 'sharp'
import type {RectWidthHeight} from '../text-localisation.js'
import type {Vector3} from '../../score-collection/helpers.js'
import type Frame from '../frame.js'

export enum TextLogicalOperation {
  and = 'AND',
  or = 'OR'
}

export type DetectFunctionsCharacteristic = {
  features?: {
    image: Sharp
    minMatches: number
    /* only if feature is text */
    expectedPosition?: RectWidthHeight
    textSize?: { height: number, width: number }
    eitherOfKey?: string
  }[],
  colors?: {
    values: Vector3
    minRelativeCoverage?: number
    maxRelativeCoverage?: number
    /* distance of any given pixel value to color value to be considered this color */
    maxDistance?: number
    eitherOfKey?: string
  }[],
  text?: {
    string: string | string[]
    /** @default OR */
    logicalOperation?: TextLogicalOperation
    maxDistance?: number
    psm?: number
    expectedPosition?: RectWidthHeight
    textSize?: { height: number, width: number }
    minTextSizeCoverage?: number
    rects?: Region[]
    expectedPositionAsRect?: true
    eitherOfKey?: string
  }[],
  scripts?: {
    check: (frame: Frame) => boolean | Promise<boolean>
    eitherOfKey?: string
  }[],
}

export type DetectFunctionsCharacteristics = Partial<{ [Key in Exclude<Frame['view'], null>]: DetectFunctionsCharacteristic }>
export type EitherOf = Record<string, (null | boolean)[]>
export type EitherOfIndexMap = Map<NonNullable<DetectFunctionsCharacteristic[keyof DetectFunctionsCharacteristic]>[number], number>
