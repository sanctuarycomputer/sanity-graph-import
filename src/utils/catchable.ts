export class CaughtError {
  constructor(
    public error: Error,
    public errorMessage: string | undefined,
    public retry: () => any | Promise<any>
  ) {}
}

export const isCaughtError = (e: any): e is CaughtError =>
  e instanceof CaughtError

export type MaybeError<T> = T | CaughtError

type SomeFn = (...args: any[]) => any | Promise<any>

export const catchable = <Fn extends SomeFn>(fn: Fn) => (
  ...params: Parameters<typeof fn>
): ReturnType<typeof fn> | Promise<CaughtError> => {
  try {
    return fn(...params)
  } catch (error) {
    const retry = () => fn(params)
    return new Promise((resolve) =>
      resolve(new CaughtError(error, error.message, retry))
    )
  }
}
