export function dateDiff(first, second) {
  // Take the difference between the dates and divide by milliseconds per day.
  // Round to nearest whole number to deal with DST.
  return Math.round(Math.abs((first - second) / (1000 * 60 * 60 * 24)))
}

export const normalize = (response: Record<string, unknown[]>, key: string) => {
  const keys = Object.keys(response)
  const ids = response[key]

  if (!ids) return {}
  const content = ids.map((e, i) => {
    const obj = {}
    keys.forEach(e => {
      if (response[e]) {
        Object.assign(obj, { [e]: response[e][i] })
      } else {
        console.warn(`${e} not found`)
      }
    })
    return obj
  })
  const items = {}
  ids.forEach((e, i) => {
    items[e] = content[i]
  })
  return items
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
