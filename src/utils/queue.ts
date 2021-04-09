import PQueue from 'p-queue'
import cliProgress from 'cli-progress'
import { MaybeError, CaughtError, isCaughtError, catchable } from './catchable'
import { debugError, debugResult } from './logging'

type QueueOpts = ConstructorParameters<typeof PQueue>[0]
type Task<TaskResultType> =
  | (() => PromiseLike<TaskResultType>)
  | (() => TaskResultType)

export type QueueResults<ReturnType> = [ReturnType[], CaughtError[]]

const defaultOptions = {
  concurrency: 1,
  interval: 1000 / 25,
}

const parseQueueResults = <T>(results: MaybeError<T>[]) =>
  results.reduce<QueueResults<T>>(
    (parsed, result) => {
      if (isCaughtError(result)) {
        return [parsed[0], [...parsed[1], result]]
      }
      return [[...parsed[0], result], parsed[1]]
    },
    [[], []]
  )

export const queue = async <ReturnType>(
  tasks: Task<ReturnType>[],
  options: QueueOpts = {}
): Promise<QueueResults<ReturnType>> => {
  const queueBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  )
  queueBar.start(tasks.length, 0)
  const queue = new PQueue({
    ...defaultOptions,
    ...options,
  })
  queue.on('next', () => {
    queueBar.increment()
  })

  const results = await queue.addAll<ReturnType | CaughtError>(
    tasks.map((task) =>
      catchable(async () => {
        try {
          const result = await task()
          debugResult(result)
          return result
        } catch (error) {
          if (process.env.FAIL_FAST) {
            console.error(error)
            process.exit()
          }
          if (isCaughtError(error)) {
            debugError(error.error)
            return error
          }
          debugError(error)
          return new CaughtError(error, error.message, task)
        }
      })
    )
  )
  queueBar.stop()
  return parseQueueResults(results)
}
