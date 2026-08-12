#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import openapiTS, { astToString } from 'openapi-typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_PATH = join(ROOT_DIR, 'src', 'types', 'api.d.ts')
const LOCAL_SPEC_PATH = join(ROOT_DIR, 'docs', 'openapi.json')

const main = async () => {
  const urlArg = process.argv.find((arg) => arg.startsWith('--url='))
  let schema

  if (urlArg) {
    const url = urlArg.split('=')[1]
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`)
    }
    schema = await response.json()
  } else {
    schema = JSON.parse(readFileSync(LOCAL_SPEC_PATH, 'utf-8'))
  }

  const ast = await openapiTS(schema)
  const output = astToString(ast)

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, output)

  console.log(`Generated ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
