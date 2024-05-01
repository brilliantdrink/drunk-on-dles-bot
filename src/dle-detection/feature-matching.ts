import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as child_process from 'child_process'

import sharp, {type Sharp} from 'sharp'
import {createScheduler, ETB, US} from '../python.js'
import {projectDir} from '../dir.js'
import terminalImage from 'terminal-image'

const pythonScriptPath = path.resolve(projectDir, 'src', 'py', 'feature_matching.py')
const {request, requestAll} = createScheduler(pythonScriptPath, os.cpus().length)

const featureDirPath = path.resolve(projectDir, 'src', 'features')

export function getFeature(fileName: string) {
  const filePath = path.join(featureDirPath, fileName)
  const feature = sharp(filePath)
  featureIds.set(feature, path.parse(filePath).name)
  loadFeature(feature)
  return feature
}

export function getFeatures(dirName: string) {
  const dir = path.join(featureDirPath, dirName)
  const fileNames = fs.readdirSync(dir)
  const features: Record<string, ReturnType<typeof getFeature>> = {}
  for (const fileName of fileNames) {
    features[path.parse(fileName).name] = getFeature(path.join(dirName, fileName))
  }
  return features
}

export async function loadFeature(feature: Sharp) {
  const featureId = featureIds.get(feature)
  if (registeredFeatures.has(feature)) return featureId
  const featureBuffer = await feature.toBuffer()
  await requestAll(`feature${US}${featureId}${US}${featureBuffer.toString('base64')}\n`)
  registeredFeatures.add(feature)
  return featureId
}

const featureIds: Map<Sharp, string> = new Map()
const registeredFeatures: Set<Sharp> = new Set()

export async function getDescriptors(image: Sharp) {
  const imageBuffer = await image.toBuffer()
  const result = await request(`image_des${US}${imageBuffer.toString('base64')}\n`)
    .catch(() => 0 as unknown as void)
  if (!result) return null

  return result.endsWith(ETB) ? result.substring(0, result.length - 1) : result
}

const cache: Map<string, Map<Sharp, number>> = new Map()

export async function matchFeature(imageDes: string, feature: Sharp) {
  if (typeof imageDes === 'object' && 'then' in (imageDes as unknown as Promise<string>)) {
    console.warn('Passed unresolved Promise to matchFeature')
    return 0
  }
  let cached = cache.get(imageDes)?.get(feature)
  if (cached) return cached
  // const start = performance.now()
  const featureId = await loadFeature(feature)

  const result = await request(`match${US}${featureId}${US}${imageDes}\n`)
  const numberString = result.endsWith(ETB) ? result.substring(0, result.length - 1) : result
  const number = Number(numberString)
  if (!cache.has(imageDes)) cache.set(imageDes, new Map())
  cache.get(imageDes)?.set(feature, number)
  // const end = performance.now()
  // console.debug(`Matched pattern in ${end - start}ms`)
  return number
}

export const clearFeatureCache = () => cache.clear()
