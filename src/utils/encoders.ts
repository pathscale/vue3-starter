import base32Encode from 'base32-encode'

export function encodePassword(password: string) {
  const buf = new ArrayBuffer(password.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = password.length; i < strLen; i++) {
    // eslint-disable-next-line unicorn/prefer-code-point
    bufView[i] = password.charCodeAt(i)
  }
  return base32Encode(bufView, 'Crockford')
}
