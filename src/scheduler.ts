export default class Scheduler {
  callback: Function
  _interval: number
  nextExec: number | null

  currentTimeout: NodeJS.Timeout

  constructor(callback: Function, interval: number) {
    this.callback = callback
    this._interval = interval
    this.nextExec = null
    this.currentTimeout = null!
  }

  static start(callback: Function, interval: number) {
    const dynamicInterval = new Scheduler(callback, interval)
    setTimeout(() => dynamicInterval.#repeat())
    return dynamicInterval
  }

  start() {
    return this.#repeat()
  }

  stop() {
    clearTimeout(this.currentTimeout)
  }

  async #repeat() {
    const execStart = performance.now()
    const elapsedTime = performance.now() - execStart
    const nextExecMillisFromNow = Math.max(0, this._interval - elapsedTime)
    this.nextExec = performance.now() + nextExecMillisFromNow
    this.currentTimeout = setTimeout(() => this.#repeat(), nextExecMillisFromNow)
    try {
      const returnValue = this.callback()
      if ('catch' in returnValue) returnValue.catch(console.error)
      await returnValue
    } catch (e) {
      console.error(e)
    }
  }

  get interval() {
    return this._interval
  }

  set interval(newInterval: number) {
    if (this._interval === newInterval) return
    this._interval = newInterval
    if (!this.nextExec || !this.currentTimeout) return
    clearTimeout(this.currentTimeout)
    const currentInterval = this._interval
    const nextExecRaw= this.nextExec - currentInterval + newInterval
    /* i don't know, i'm drunk */
    const nextExecMillisFromNow= Math.max(0, nextExecRaw - performance.now())
    this.nextExec = performance.now() + nextExecMillisFromNow
    this.currentTimeout = setTimeout(() => this.#repeat(), nextExecMillisFromNow)
  }
}
