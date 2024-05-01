import {DataTypes} from 'sequelize'
import {Model, sequelize} from './config.js'
import type {default as FrameClass, DLETypes} from '../dle-detection/frame.js'

export class Frame extends Model {
  declare frame: Buffer
  declare detectedDLE?: DLETypes
  declare view: string
  declare timestamp: number
  declare recognisedText: string
  declare recognisedTimeguessrText?: [string, string, string]

  declare perf: FrameClass['perf']
  declare retrospected: boolean
}

Frame.init({
  frame: DataTypes.BLOB,
  detectedDLE: {
    type: DataTypes.ENUM,
    values: ['wordle', 'connections', 'crossword-mini', 'tradle', 'waffle', 'worldle', 'globle', 'travle', 'timeguessr', 'spellcheck', 'bandle']
  },
  view: DataTypes.STRING,
  timestamp: DataTypes.DATE,
  recognisedText: DataTypes.TEXT,
  recognisedTimeguessrText: DataTypes.ARRAY(DataTypes.TEXT),

  perf: DataTypes.JSONB,
  retrospected: DataTypes.BOOLEAN,
}, {sequelize})

await Frame.sync({alter: true})

export async function saveFrame(frame: FrameClass) {
  const frameEntry = Frame.build()
  frameEntry.frame = await frame.imageSharp.webp({
    quality: 20,
    smartSubsample: true,
    effort: 6
  }).toBuffer()
  if (frame.detectedDle)
    frameEntry.detectedDLE = frame.detectedDle
  frameEntry.view = String(frame.view)
  frameEntry.timestamp = frame.timestamp
  frameEntry.recognisedText = (await frame.recognisedText)?.substring(0, 1023) ?? ''
  const recognisedTimeguessrText = (await frame.recognisedTimeguessrTextPromise)?.map(text => text?.substring(0, 1023))
  if (recognisedTimeguessrText)
    frameEntry.recognisedTimeguessrText = recognisedTimeguessrText as Frame['recognisedTimeguessrText']

  if (frame.perf) frameEntry.perf = frame.perf

  const hasRetrospected = frameEntry.retrospected = !!('retrospected' in frame && frame.retrospected)
  if (hasRetrospected) {
    saveFrame(frame.retrospected as FrameClass)
  }

  await frameEntry.save()
}
