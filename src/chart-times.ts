import {ChartJSNodeCanvas} from 'chartjs-node-canvas'
import {Frame} from './db/frames.js'
import type {ChartConfiguration} from 'chart.js'
import terminalImage from 'terminal-image'
import {Op} from 'sequelize'

const today = new Date()
today.setHours(6)
const data = await Frame.findAll({order: [['timestamp', 'ASC']], where: {timestamp: {[Op.gte]: today}}})
const width = 1920
const height = 1080
const backgroundColour = 'white'
const chartJSNodeCanvas = new ChartJSNodeCanvas({width, height, backgroundColour})

const configuration: ChartConfiguration = {
  type: 'bar',
  data: {
    labels: data.map((_, index) => String(index)),
    datasets: [{
      data: data.map((frame, index) =>
        index === 0 ? 0 : (frame.timestamp - data[index - 1].timestamp) / 1000
      )
    }]
  },
  options: {
    scales: {
      y: {
        min: 0,
        max: 50,
        type: 'logarithmic',
      },
    },
  },
}
const image = await chartJSNodeCanvas.renderToBuffer(configuration)
console.log(await terminalImage.buffer(image))
// const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration)
// const stream = chartJSNodeCanvas.renderToStream(configuration)
