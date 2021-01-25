import chalk from 'chalk'

const mainColor = chalk.white
const errorColor = chalk.bold.red
const writeColor = chalk.green
const fetchColor = chalk.green
const deleteColor = chalk.yellow

/* eslint-disable no-console */
export const log = (str: string) => console.log(mainColor(str))
export const logFetch = (str: string) => console.log(fetchColor(str))
export const logDelete = (str: string) => console.log(deleteColor(str))
export const logWrite = (str: string) => console.log(writeColor(str))
export const logError = (str: string) => console.log(errorColor(str))
