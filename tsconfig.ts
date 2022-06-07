export interface Tsconfig {
  compilerOptions: CompilerOptions
  include: string[]
  exclude: string[]
}

export interface CompilerOptions {
  target: string
  module: string
  strict: boolean
  jsx: string
  importHelpers: boolean
  moduleResolution: string
  resolveJsonModule: boolean
  esModuleInterop: boolean
  allowSyntheticDefaultImports: boolean
  sourceMap: boolean
  baseUrl: string
  paths: Paths
  lib: string[]
  types: string[]
}

export interface Paths {
  '~/*': string[]
}
