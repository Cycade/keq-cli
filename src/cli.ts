#!/usr/bin/env node

import { Command, Option } from 'commander'
import { build } from './build'
import { compile } from './compile'
import { cosmiconfig } from 'cosmiconfig'
import { CosmiconfigResult } from 'cosmiconfig/dist/types'
import Ajv from 'ajv'
import * as configSchema from './schema/config.json'
import * as chalk from 'chalk'


const program = new Command()
const explore = cosmiconfig('keq')
const ajv = new Ajv({ useDefaults: true })
const validate = ajv.compile(configSchema)


program
  .command('build')
  .option('-c --config', 'The build config file')
  .action(async options => {
    let result: CosmiconfigResult
    if (options.config) {
      result = await explore.load(options.config)
    } else {
      result = await explore.search()
    }

    if (!result || ('isEmpty' in result && result.isEmpty)) {
      throw new Error('Cannot find config file.')
    }

    const valid = validate(result.config)
    if (!valid) throw new Error(chalk.red(`Invalid Config: ${ajv.errorsText(validate.errors, { dataVar: 'config' })}`))
    await build(result.config)
  })

program
  .command('compile <filepath>')
  .description('Build the swagger file')
  .requiredOption('-o, --outdir <outdir>', 'The output directory')
  .requiredOption('-m --module-name <module_name>', 'The module name')
  .addOption(new Option('--file-naming-style <fileNamingStyle>').choices(['camelCase' , 'capitalCase' , 'constantCase' , 'dotCase' , 'headerCase' , 'noCase' , 'paramCase' , 'pascalCase' , 'pathCase' , 'sentenceCase' , 'snakeCase']).default('snakeCase'))
  .option('--no-strict', 'disable strict mode', true)
  .action(async(filepath, options) => {
    await compile(options.moduleName, filepath, options)
  })

async function main(): Promise<void> {
  program.on('command:*', function(operands) {
    throw new Error(`Unknown command '${operands[0]}'`)
  })

  try {
    await program.parseAsync(process.argv)
  } catch (e) {
    console.error(chalk.red(e.message))
  }
}

main()
