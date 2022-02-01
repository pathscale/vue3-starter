import { useCssVariables } from 'vue-composable'

// token mapping to transform sass variables into css variables
const mapTokens = {
  background: 'bg',
  invert: 'inv',
  scheme: 'sch',
  text: 'txt',
  large: 'lg',
  disabled: 'dsbl',
  current: 'cur',
  toggle: 'tgl',
  border: 'bd',
  margin: 'm',
  padding: 'p',
  color: 'clr',
  size: 's',
  button: 'bt',
  warning: 'warn',
  danger: 'dang',
  success: 'sucs',
  primary: 'prim',
  dimensions: 'dim',
  content: 'ct',
  heading: 'hdg',
  header: 'hd',
  footer: 'ft',
  notification: 'noti',
  progress: 'prg',
  dropdown: 'drp',
  divider: 'dvd',
  item: 'itm',
  hover: 'hov',
  focus: 'foc',
  active: 'act',
  message: 'msg',
  pagination: 'pag',
  control: 'ctrl',
  breadcrumb: 'bread',
  navbar: 'nav',
  panel: 'pnl',
  section: 'sct',
}

// finds the correspoding css variable name for a given bulma sass variable name
const sassToCss = sassVariable => {
  return (
    '--blm-' +
    sassVariable
      .slice(1)
      .split('-')
      .map(token => mapTokens[token] || token)
      .join('-')
  )
}

// takes a value, if it is a sass variable it will parse it and return it, otherwise returns the value
const parseValue = value => {
  if (value[0] === '$') {
    return `var(${sassToCss(value)})`
  }

  return value
}

// takes a theme written with bulma sass variables and updates the dom with
//  the corresponding css variables
const setTheme = theme => {
  // process theme content
  const themeVariables = Object.keys(theme)

  const cssVariables = themeVariables.map(themeVariable => sassToCss(themeVariable))
  const cssValues = themeVariables.map(themeVariable => parseValue(theme[themeVariable]))

  // construct array of final variables [{ name, value }]
  const variables = cssVariables.map((name, index) => ({ name, value: cssValues[index] }))

  // remove empty variables
  const finalVariables = variables.filter(variable => Boolean(variable.value))

  // for every variable with hex value, create h, s, l, a variables as well
  const hslaVariables = []

  finalVariables.forEach(variable => {
    if (!variable.value.includes('#')) {
      return
    }

    // this variable has got an hex value
    const { h, s, l } = hexToHSL(variable.value)

    hslaVariables.push(
      {
        name: variable.name + '-h',
        value: h.toString(),
      },
      {
        name: variable.name + '-s',
        value: s.toString() + '%',
      },
      {
        name: variable.name + '-l',
        value: l.toString() + '%',
      },
    )
  })

  finalVariables.push(...hslaVariables)

  // updates document with all new variables
  useCssVariables(finalVariables)
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
const hexToHSL = H => {
  // Convert hex to RGB first
  let r = 0,
    g = 0,
    b = 0
  if (H.length === 4) {
    r = '0x' + H[1] + H[1]
    g = '0x' + H[2] + H[2]
    b = '0x' + H[3] + H[3]
  } else if (H.length === 7) {
    r = '0x' + H[1] + H[2]
    g = '0x' + H[3] + H[4]
    b = '0x' + H[5] + H[6]
  }
  // Then to HSL
  r /= 255
  g /= 255
  b /= 255
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin

  let h = 0,
    s = 0,
    l = 0

  if (delta === 0) {
    h = 0
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6
  } else if (cmax === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)

  if (h < 0) {
    h += 360
  }

  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = Number((s * 100).toFixed(1))
  l = Number((l * 100).toFixed(1))

  return { h, s, l }
}

export { setTheme }
