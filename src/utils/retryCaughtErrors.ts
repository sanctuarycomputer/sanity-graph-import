import { queue } from './queue'
import { logError } from './logging'
import { CaughtError } from './catchable'

export const retryCaughtErrors = async <SuccessType>(
  errors: CaughtError[]
): Promise<[SuccessType[], CaughtError[]]> => {
  if (!errors.length) return [[], []]

  logError(`Retrying ${errors.length} errors...`)
  const [retriedSuccess, retriedErrors] = await queue(
    errors.map((catchableError) => () => {
      logError(`Original error: ${catchableError.errorMessage}`)
      return catchableError.retry()
    })
  )
  logError(`  ${retriedSuccess.length} successful retries`)
  logError(`  ${retriedErrors.length} failed retries`)
  return [retriedSuccess, retriedErrors]
}
