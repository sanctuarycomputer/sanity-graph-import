/* eslint-disable no-console */
import chalk from 'chalk'
import Debug from 'debug'

export const debugPatch = Debug('SGI:patch')
export const debugResult = Debug('SGI:results')
export const debugError = Debug('SGI:errors')

const mainColor = chalk.black.bgYellow
const errorColor = chalk.bold.red
const writeColor = chalk.green
const fetchColor = chalk.green
const deleteColor = chalk.yellow

/* a nice big block */
export const logHeading = (str: string) => {
  console.log('')
  const padding = Array.from({ length: str.length + 4 }, () => ' ').join('')
  console.log(mainColor(padding))
  console.log(mainColor(`  ${str}  `))
  console.log(mainColor(padding))
  console.log('')
}
export const logFetch = (str: string) => console.log(fetchColor(str))
export const logDelete = (str: string) => console.log(deleteColor(str))
export const logWrite = (str: string) => console.log(writeColor(str))
export const logError = (str: string) => console.log(errorColor(str))
