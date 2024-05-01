import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import {projectDir} from './dir.js'
import terminalImage from 'terminal-image'

if (!fs.existsSync(path.join(projectDir, '.venv'))) {
  child_process.execSync('python3.11 -m venv .venv', {cwd: projectDir})
}
child_process.execSync(
  'source .venv/bin/activate && pip install -r requirements.txt',
  {cwd: projectDir, shell: '/bin/bash', stdio: 'ignore'}
)

export const ACK = '\x06'
export const ETB = '\x17'
export const US = '\x1F'

export function invokeWorker(filePath: string, useStdbuf = false) {
  const childProcess = child_process.exec(
    `./.venv/bin/python ${filePath}`,
    {cwd: projectDir, shell: '/bin/bash', maxBuffer: 8192 * 1024}
  )
  childProcess.stderr?.on('data', console.error)

  function request(body: string, measure = false) {
    // clear the residual buffer
    childProcess.stdout?.read()

    let resolveResponsePromise: Function
    let data = '', rejectTimeout: NodeJS.Timeout = null!
    const responsePromise = new Promise<string>((resolve, reject) => {
      resolveResponsePromise = resolve
      rejectTimeout = setTimeout(() => {
        childProcess.stdout?.removeAllListeners('data')
        reject()
      }, 4000)
    })

    childProcess.stdout?.on('data', (chunk: string) => {
      data += chunk
      if (data.endsWith(ETB) || data.endsWith(ACK)) {
        childProcess.stdout?.removeAllListeners('data')
        clearTimeout(rejectTimeout)
        resolveResponsePromise(String(data))
      }
    })
    childProcess.stdin?.write(body)
    return responsePromise
  }

  return request
}

export function createScheduler(filePath: string, workersAmount: number) {
  const workers = Array(workersAmount).fill(0).map(() => invokeWorker(filePath))

  interface RequestOne {
    resolve: (value: string) => void,
    reject: (reason: any) => void,
    body: string,
  }

  interface RequestAll {
    resolve: (value: string[]) => void,
    reject: (reason: any) => void,
    body: string,
    requestAll: true,
  }

  const queue: (RequestOne | RequestAll)[] = []
  const isRequestAll = (requestData: RequestOne | RequestAll): requestData is RequestAll => 'requestAll' in requestData

  function processQueue() {
    const allWorkersEmployed = workers.length == 0
    const queueEmpty = queue.length === 0
    if (allWorkersEmployed || queueEmpty) return
    const requestData = queue.shift() as typeof queue[number]
    if (isRequestAll(requestData)) {
      if (workers.length < workersAmount) return queue.unshift(requestData)
      const {resolve, reject, body} = requestData
      const reservedWorkers: typeof workers = []
      while (workers.length !== 0) reservedWorkers.push(workers.shift() as typeof workers[number])
      Promise.all(
        reservedWorkers.map(worker => worker(body).finally(() => workers.push(worker) && processQueue()))
      ).then(resolve).catch(reject)
    } else {
      const {resolve, reject, body} = requestData
      const worker = workers.pop() as typeof workers[number]
      worker(body).finally(() => workers.push(worker) && processQueue()).then(resolve).catch(reject)
    }
  }

  function request(body: string) {
    return new Promise<string>((resolve, reject) => {
      queue.push({resolve, reject, body})
      processQueue()
    })
  }

  function requestAll(body: string) {
    return new Promise<string[]>((resolve, reject) => {
      queue.push({resolve, reject, body, requestAll: true})
      processQueue()
    })
  }

  return {request, requestAll}
}
