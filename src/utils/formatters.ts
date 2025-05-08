import randomColor from 'randomcolor'
import { dateDiff } from '~/utils/index'

export function toDateString(epoch: number) {
  const date = new Date(epoch * 1000).toDateString()
  return date
}

export function padLeft(x: number | string, len: number) {
  return x.toString().padStart(len, '0')
}

export function formatDateMMDDHHMM(epoch: number) {
  const dt = new Date(epoch * 1000)
  const month = padLeft(dt.getMonth() + 1, 2)
  const day = padLeft(dt.getDate(), 2)
  const minute = padLeft(dt.getMinutes(), 2)
  const seconds = padLeft(dt.getSeconds(), 2)

  return `${month}/${day} ${dt.getHours()}:${minute}:${seconds}`
}

export function formatDateHHMMSS(epoch: number) {
  const dt = new Date(epoch * 1000)
  const minute = padLeft(dt.getMinutes(), 2)
  const seconds = padLeft(dt.getSeconds(), 2)
  return `${dt.getHours()}:${minute}:${seconds}`
}

export function formatDateYMDHIS(epoch: number | string) {
  if (!epoch) {
    return ''
  }

  const dt = new Date(Number(epoch) * 1000)
  const year = dt.getFullYear()
  const month = padLeft(dt.getMonth() + 1, 2)
  const day = padLeft(dt.getDate(), 2)
  const hour = padLeft(dt.getHours(), 2)
  const minute = padLeft(dt.getMinutes(), 2)
  const second = padLeft(dt.getSeconds(), 2)
  const millisecond = padLeft(dt.getMilliseconds(), 3)

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`
}

export function formatDateMDHIS(epoch: number | string) {
  if (!epoch) {
    return ''
  }

  const dt = new Date(Number(epoch) / 1e6)
  const month = padLeft(dt.getMonth() + 1, 2)
  const day = padLeft(dt.getDate(), 2)
  const hour = padLeft(dt.getHours(), 2)
  const minute = padLeft(dt.getMinutes(), 2)
  const second = padLeft(dt.getSeconds(), 2)

  return `${month}-${day} ${hour}:${minute}:${second}`
}

export function formatDateYYYYMMDD(epoch: number) {
  const dt = new Date(epoch * 1000)
  const YYYY = dt.getFullYear()
  const MM = dt.getMonth() + 1
  const DD = dt.getDate()

  return `${YYYY}-${MM}-${DD}`
}

/**
 * Formats a timestamp into the DD-MM-YYYY date format.
 * @param timestamp - The timestamp to format, representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
 * @returns The formatted date string in the DD-MM-YYYY format.
 */
export function formatDateDDMMYYYY(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return `${padLeft(date.getDate(), 2)}-${padLeft(date.getMonth() + 1, 2)}-${date.getFullYear()}`
}

export function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

export function formatNumberToCurrency(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function formatNextClaimAt(n: number) {
  return n ? `In ${dateDiff(Date.now(), Number(new Date(toDateString(n))))} days` : 'Waiting sync'
}

export function formatCamelCase(s: string) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
}

export const titleCase = (s: string) =>
  s
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase()) // First char after each -/_

export const dateToUnix = (value: string): number => {
  return Number.parseInt((new Date(value).getTime() / 1000).toFixed(0))
}

export const numberPrecision = (n: number) => {
  return n.toFixed(20).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
}

export const maskWallet = (s: string) => {
  return s.replace(/^(\w{5})(.+)(\w{5})$/, '$1*****$3')
}

export const formatCurrency = (value: number, decimalDigits = 10) => {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  }).format(value)

  return formattedValue
}

export const formatTransactionKind = (id: number) => {
  switch (id) {
    case 1:
      return 'Tornado cash withdraw'
    case 2:
      return 'Transfer from fixed float'
    case 3:
      return 'Suspicious contract created'
    case 4:
      return 'Tornado cash deposit'
    default:
      return 'Unknown transaction'
  }
}

export const formatChain = (id: number) => {
  switch (id) {
    case 1:
      return 'Mainnet'
    case 2:
      return 'Morden'
    case 3:
      return 'Ropsten'
    case 4:
      return 'Rinkeby'
    case 5:
      return 'Goerli'
    case 42:
      return 'Kovan'
    case 17_000:
      return 'Holesky'
    case 11_155_111:
      return 'Sepolia'
    case 10:
      return 'Optimism'
    case 69:
      return 'OptimismKovan'
    case 420:
      return 'OptimismGoerli'
    case 11_155_420:
      return 'OptimismSepolia'
    case 42_161:
      return 'Arbitrum'
    case 421_611:
      return 'ArbitrumTestnet'
    case 421_613:
      return 'ArbitrumGoerli'
    case 421_614:
      return 'ArbitrumSepolia'
    case 42_170:
      return 'ArbitrumNova'
    case 25:
      return 'Cronos'
    case 338:
      return 'CronosTestnet'
    case 30:
      return 'Rsk'
    case 56:
      return 'BinanceSmartChain'
    case 97:
      return 'BinanceSmartChainTestnet'
    case 99:
      return 'Poa'
    case 77:
      return 'Sokol'
    case 534_352:
      return 'Scroll'
    case 534_353:
      return 'ScrollAlphaTestnet'
    case 1_088:
      return 'Metis'
    case 100:
      return 'Gnosis'
    case 137:
      return 'Polygon'
    case 80_001:
      return 'PolygonMumbai'
    case 1_101:
      return 'PolygonZkEvm'
    case 1_442:
      return 'PolygonZkEvmTestnet'
    case 250:
      return 'Fantom'
    case 4_002:
      return 'FantomTestnet'
    case 1_284:
      return 'Moonbeam'
    case 1_281:
      return 'MoonbeamDev'
    case 1_285:
      return 'Moonriver'
    case 1_287:
      return 'Moonbase'
    case 1_337:
      return 'Dev'
    case 31_337:
      return 'AnvilHardhat'
    case 9_001:
      return 'Evmos'
    case 9_000:
      return 'EvmosTestnet'
    case 10_200:
      return 'Chiado'
    case 26_863:
      return 'Oasis'
    case 42_262:
      return 'Emerald'
    case 42_261:
      return 'EmeraldTestnet'
    case 314:
      return 'FilecoinMainnet'
    case 314_159:
      return 'FilecoinCalibrationTestnet'
    case 43_114:
      return 'Avalanche'
    case 43_113:
      return 'AvalancheFuji'
    case 42_220:
      return 'Celo'
    case 44_787:
      return 'CeloAlfajores'
    case 62_320:
      return 'CeloBaklava'
    case 1_313_161_554:
      return 'Aurora'
    case 1_313_161_555:
      return 'AuroraTestnet'
    case 7_700:
      return 'Canto'
    case 740:
      return 'CantoTestnet'
    case 288:
      return 'Boba'
    case 8_453:
      return 'Base'
    case 84_531:
      return 'BaseGoerli'
    case 59_144:
      return 'Linea'
    case 59_140:
      return 'LineaTestnet'
    case 324:
      return 'ZkSync'
    case 280:
      return 'ZkSyncTestnet'
    case 5_000:
      return 'Mantle'
    case 5_001:
      return 'MantleTestnet'
    case 7_777_777:
      return 'Zora'
    case 999:
      return 'ZoraGoerli'
    case 999_999_999:
      return 'ZoraSepolia'
    default:
      return 'Unknown chain'
  }
}

export function formatTimestamp(timestamp: number, timeOnly = true) {
  const dateObject = new Date(timestamp)

  const year = dateObject.getFullYear()
  const month = String(dateObject.getMonth() + 1).padStart(2, '0')
  const day = String(dateObject.getDate()).padStart(2, '0')
  const hours = String(dateObject.getHours()).padStart(2, '0')
  const minutes = String(dateObject.getMinutes()).padStart(2, '0')
  const seconds = String(dateObject.getSeconds()).padStart(2, '0')
  const milliseconds = String(dateObject.getMilliseconds()).padStart(3, '0')

  if (timeOnly) {
    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

export function formatNumber(value: number, decimalPlaces = 4): string {
  return value?.toFixed(decimalPlaces).replace(/\.?0+$/, '')
}
export function stringToHexColor(str: string): string {
  return randomColor({ seed: str, luminosity: 'dark' })
}
