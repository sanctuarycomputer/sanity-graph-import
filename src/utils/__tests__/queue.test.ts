import { queue } from '../queue'

const dogs = ['frank', 'muenster', 'ida', 'moe']

const upCase = (str: string): string =>
  [str.charAt(0).toUpperCase(), str.slice(1)].join('')

const upCaseAsync = async (str: string): Promise<string> =>
  [str.charAt(0).toUpperCase(), str.slice(1)].join('')

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

describe('queue', () => {
  it('should work with sync functions', async () => {
    const results = await queue(dogs.map((dog) => () => upCase(dog)))
    expect(results[0]).toBe('Frank')
    expect(results[1]).toBe('Muenster')
  })

  it('should work with async functions', async () => {
    const results = await queue(dogs.map((dog) => () => upCaseAsync(dog)))
    expect(results[0]).toBe('Frank')
    expect(results[1]).toBe('Muenster')
  })

  it('should apply custom addAll options', async () => {
    const result = await queue(
      dogs.map((dog) => async () => {
        await sleep(50)
        return upCaseAsync(dog)
      }),
      // The promises will time out and return undefined
      { timeout: 1 }
    )
    expect(result).toEqual([undefined, undefined, undefined, undefined])
  })
})
