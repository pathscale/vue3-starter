/**
 * This script automates the generation of DTOs (Data Transfer Objects) from a JSON schema.
 * It reads the 'services.json' file, processes the schema, and generates interface files for DTOs.
 * The purpose is to ensure that the DTOs stay in sync with the backend API definitions.
 * By running this script whenever the backend team updates the 'services.json' file,
 * the DTOs can be automatically regenerated to reflect the changes.
 *
 * The script uses the 'json-schema-to-typescript' library to compile JSON schemas into TypeScript interfaces.
 * It applies string transformations and creates additional files for exporting the generated interfaces.
 * The resulting DTOs provide type-checking and help maintain a consistent data structure throughout the project.
 *
 * To use this script, make sure to have the 'services.json' file in the expected format and install the necessary dependencies.
 * Run the script whenever there are updates to the backend API to keep the DTOs up to date.
 */

import { readFile } from 'node:fs/promises'
// eslint-disable-next-line no-restricted-syntax
import * as fs from 'node:fs'
import path, { dirname } from 'node:path'

import { fileURLToPath } from 'node:url'

import { compile } from 'json-schema-to-typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const snakeToCamelCase = str =>
  str
    ?.toLowerCase()
    ?.replace(/([-_][a-z0-9])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))

const file = await readFile('./docs/services.json', 'utf-8')
const basePath = path.join(__dirname, 'src/models')

const apiBasePath = path.join(__dirname, 'src/api/services')

const schema = JSON.parse(file)

const TYPES = {
  String: 'string',
  Boolean: 'boolean',
  UUID: 'string',
  BigInt: 'number',
  Numeric: 'number',
  Int: 'number',
}

const KEYS = ['parameters', 'returns', 'stream_response']

schema.services.forEach(service => {
  const dir = `${basePath}/${service.name}`

  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  const methods = {}

  const loopParse = rawSchema => {
    let type = TYPES.String
    const schemaItems = {}
    schemaItems.required = []
    if (typeof rawSchema?.ty === 'string') {
      type = TYPES[rawSchema.ty] || 'string'
      schemaItems.required = true
      schemaItems.type = type
    } else if (typeof rawSchema.ty?.Optional === 'string') {
      type = TYPES[rawSchema.ty.Optional] || 'string'
      schemaItems.type = type
    } else if (rawSchema.ty?.EnumRef) {
      schemaItems.required = [rawSchema.name]
      schemaItems.type = 'string'
    } else if (rawSchema.ty?.Optional?.EnumRef) {
      schemaItems.type = 'string'
    } else if (rawSchema.ty?.Optional?.Vec) {
      schemaItems.type = 'array'
      if (typeof rawSchema.ty.Optional.Vec === 'string') {
        schemaItems.items = {}
        schemaItems.items.type = TYPES[rawSchema.ty.Optional.Vec]
      } else if (rawSchema.ty.Optional.Struct) {
        schemaItems.properties = {}
        rawSchema.ty.Optional.Struct.fields.forEach(subRawSchema => {
          schemaItems.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
        })
      }
    } else if (rawSchema.ty?.Optional?.DataTable) {
      schemaItems.type = 'array'
      schemaItems.items = {}
      schemaItems.items.properties = {}
      schemaItems.items.required = []
      schemaItems.items.type = 'object'
      rawSchema.ty.Optional.DataTable.fields.forEach(subRawSchema => {
        schemaItems.items.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
        if (!subRawSchema.ty.Optional) {
          schemaItems.items.required.push(snakeToCamelCase(subRawSchema.name))
        }
      })
    } else if (rawSchema.ty?.DataTable) {
      schemaItems.type = 'array'
      schemaItems.properties = {}
      schemaItems.required = [snakeToCamelCase(rawSchema.name)]
      schemaItems.items = {}
      schemaItems.items.type = 'object'
      schemaItems.items.properties = {}
      schemaItems.items.required = []
      rawSchema.ty.DataTable.fields.forEach(subRawSchema => {
        schemaItems.items.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
        schemaItems.items.required.push(snakeToCamelCase(subRawSchema.name))
      })
    } else if (rawSchema.ty.Struct) {
      schemaItems.type = 'object'
      schemaItems.required = [snakeToCamelCase(rawSchema.name)]
      schemaItems.properties = {}
      rawSchema.ty.Struct.fields.forEach(subRawSchema => {
        schemaItems.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
        schemaItems.required.push(snakeToCamelCase(subRawSchema.name))
      })
    } else if (rawSchema.ty.Optional?.Struct) {
      schemaItems.properties = {}
      rawSchema.ty.Optional.Struct.fields.forEach(subRawSchema => {
        schemaItems.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
      })
    } else if (rawSchema.ty?.Vec?.Struct) {
      schemaItems.type = 'array'
      schemaItems.required = [snakeToCamelCase(rawSchema.name)]
      schemaItems.items = {}
      schemaItems.items.type = 'object'
      schemaItems.items.properties = {}
      schemaItems.items.required = []
      rawSchema.ty.Vec.Struct.fields.forEach(subRawSchema => {
        schemaItems.items.properties[snakeToCamelCase(subRawSchema.name)] = loopParse(subRawSchema)
        schemaItems.items.required.push(snakeToCamelCase(subRawSchema.name))
      })
    }
    return schemaItems
  }

  service.endpoints.forEach(async endpoint => {
    const schemas = {}

    for (let index = 0; index < KEYS.length; index++) {
      const key = KEYS[index]
      let title = ''
      if (key === 'parameters') {
        title = `${endpoint.name}Params`
      } else if (key === 'returns') {
        title = `${endpoint.name}Response`
      } else if (key === 'stream_response') {
        title = `${endpoint.name}StreamResponse`
      }
      const jsonSchema = {
        title: `${endpoint.name}${key === 'returns' ? 'Response' : 'Params'}`,
        type: 'object',
        additionalProperties: false,
        properties: {},
        required: [],
      }

      if (key === 'parameters') {
        methods[endpoint.code] = {
          name: endpoint.name,
          parameters: endpoint.parameters.map(param => snakeToCamelCase(param.name)),
        }
      }
      if (key !== 'stream_response') {
        endpoint[key].forEach(param => {
          jsonSchema.properties[snakeToCamelCase(param.name)] = loopParse(param)
        })
        jsonSchema.required = endpoint[key]
          .filter(param => !param.ty?.Optional)
          .map(param => snakeToCamelCase(param.name))
        schemas[key] = await compile(jsonSchema, `${dir}/${endpoint.name}Dto.ts`, {
          bannerComment: index ? '/* Response */ \n' : undefined,
          additionalProperties: false,
        })
      } else if (endpoint[key]) {
        const jsonSchema = {
          title: `${endpoint.name}StreamResponse`,
          additionalProperties: false,
          ...loopParse({ ty: endpoint[key] }),
        }
        schemas[key] = await compile(jsonSchema, `${dir}/${endpoint.name}Dto.ts`, {
          bannerComment: index ? '/* Response */ \n' : undefined,
          additionalProperties: false,
        })
      }


    }

    // eslint-disable-next-line prettier/prettier
    fs.writeFileSync(
      `${dir}/${endpoint.name}Dto.ts`,
      Object.values(schemas).join('').replaceAll('\'', ''),
    )
  })

  fs.writeFileSync(
    `${dir}/index.ts`,
    // eslint-disable-next-line quotes
    service.endpoints.map(endpoint => `export * from './${endpoint.name}Dto';`).join('\r\n'),
  )

  fs.writeFileSync(`${apiBasePath}/${service.name}.json`, JSON.stringify(methods, null, 2))
})
