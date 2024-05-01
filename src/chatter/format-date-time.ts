export function formatDateTime(date: Date) {
  // const date = new Date()
  const DAY_IN_MILLIS = 1000 * 60 * 60 * 24
  const time = date.toLocaleTimeString('en-ZA', {timeZone: 'Africa/Johannesburg', timeZoneName: 'short'})
  const rtf = new Intl.RelativeTimeFormat('en-ZA', {numeric: 'auto'})
  const today = new Date()
  today.setHours(date.getHours())
  today.setMinutes(date.getMinutes() + 1)
  const diff = date.valueOf() - today.valueOf()
  const day = rtf.format(Math.trunc(diff / DAY_IN_MILLIS), 'day')
  return `${day}, ${time}`
}
const capitalise = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
