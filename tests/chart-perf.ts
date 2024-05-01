import {ChartJSNodeCanvas} from 'chartjs-node-canvas'
import type {ChartConfiguration} from 'chart.js'
import 'chartjs-plugin-datalabels'
import terminalImage from 'terminal-image'
import sharp from 'sharp'
import perf from '../detect-perf-tradle.json'
import type Frame from '../src/dle-detection/frame.js'
import * as fs from 'fs'

const data = perf as Record<string, Record<string, Record<string, Frame['perf'][]>>>
const height = 1080, width = 1920, cols = 3
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width, height,
  backgroundColour: 'white',
  plugins: {modern: ['chartjs-plugin-datalabels']}
})

function avg(list: (number | unknown)[]) {
  let acc = 0, counted = 0
  for (const number of list) if (typeof number === 'number') {
    acc += number
    counted++
  }
  return acc / counted
}

function roundToDecimal(value: number, decimal: number = 2) {
  return Math.round(value * 10 ** decimal) / 10 ** decimal
}

// detector game -> image game -> measurements
const grouped: Record<string, Record<string, Frame['perf'][]>> = {}
for (const detectorGame in data) {
  grouped[detectorGame] = {}
  for (const imageGame in data[detectorGame]) {
    grouped[detectorGame][imageGame] = Object.values(data[detectorGame][imageGame]).flat()
  }
}

const getValueRounded = (detector: keyof typeof grouped, key: keyof Frame['perf'], decimal = 2) => {
  return Object.values(grouped[detector])
    .map(performances => roundToDecimal(avg(performances.map(frame => frame[key]))))
}

const images: Record<string, Buffer> = {}

for (const detector in grouped) {
  const configuration: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: Object.keys(grouped[detector]),
      datasets: [{
        label: 'Total',
        backgroundColor: '#565656',
        data: getValueRounded(detector, 'dleDetection')
      }, {
        label: 'Specific DLE Detection',
        backgroundColor: '#70cb70',
        data: getValueRounded(detector, 'detectors')
      }, {
        label: 'Descriptor Generation',
        backgroundColor: '#7c4ad0',
        data: getValueRounded(detector, 'desGeneration')
      }, {
        label: 'Text Localisation',
        backgroundColor: '#c2814a',
        data: getValueRounded(detector, 'textRects')
      }, {
        label: 'Text Recognition',
        backgroundColor: '#47b6e5',
        data: getValueRounded(detector, 'ocr')
      }, {
        label: 'Text Recognition (Inverted)',
        backgroundColor: '#4275bd',
        data: getValueRounded(detector, 'ocrInverted')
      },],
    },
    options: {
      /*scales: {
        y: {
          min: 0,
          max: 1000,
          // type: 'logarithmic',
        },
      },*/
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: 'black',
          formatter: value => value
        }
      },
    },
  }

  images[detector] = await chartJSNodeCanvas.renderToBuffer(configuration)
  if (Object.keys(grouped).length === 1) {
    await useImage(images[detector])
    process.exit()
  }
}

const composite = await sharp({
  create: {
    width: width * cols,
    height: Math.ceil(Object.keys(images).length / cols) * height,
    channels: 3,
    background: 'white',
  }
})
  .composite(Object.values(images).map((image, index) => ({
    input: image,
    left: (index % cols) * width,
    top: Math.floor(index / cols) * height,
    blend: 'over',
  })))
  .png()
  .toBuffer()
await useImage(composite)

async function useImage(buffer: Buffer) {
  if (process.argv[2]) {
    fs.writeFileSync(process.argv[2], buffer)
  } else {
    console.log(await terminalImage.buffer(buffer))
  }
}
