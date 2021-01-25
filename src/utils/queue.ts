import PQueue from 'p-queue'

type QueueOpts = ConstructorParameters<typeof PQueue>[0]
type Task<TaskResultType> =
  | (() => PromiseLike<TaskResultType>)
  | (() => TaskResultType)

const defaultOptions = {
  concurrency: 1,
  interval: 1000 / 25,
}

export const queue = async <ReturnType = any>(
  tasks: ReadonlyArray<Task<ReturnType>>,
  options: QueueOpts = {}
): Promise<ReturnType[]> => {
  const queue = new PQueue({
    ...defaultOptions,
    ...options,
  })
  return queue.addAll<ReturnType>(tasks)
}
