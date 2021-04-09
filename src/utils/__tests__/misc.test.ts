import { flat, unique, chunk, partition, definitely } from '../misc'

describe('flat', () => {
  it('should return a flattened array', () => {
    const arr = [
      [1, 2],
      [3, 4],
    ]
    expect(flat(arr)).toEqual([1, 2, 3, 4])
  })
})

describe('unique', () => {
  it('should return a unique array', () => {
    const arr = [1, 2, 3, 1, 2, 3]
    expect(unique(arr)).toEqual([1, 2, 3])
  })
})

describe('chunk', () => {
  it('should chunk an array into N items', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7]
    const chunked = chunk(arr, 2)
    expect(chunked[0]).toEqual([1, 2])
    expect(chunked[1]).toEqual([3, 4])
    expect(chunked[2]).toEqual([5, 6])
    expect(chunked[3]).toEqual([7])
  })
})

describe('partition', () => {
  it('should split an array into two based on a predicate function', () => {
    const arr = ['one', 'two', 3, 4, 'five', 6]
    const isString = (arg: string | number): arg is string =>
      typeof arg === 'string'

    const [strings, nums] = partition(arr, isString)
    expect(strings).toEqual(['one', 'two', 'five'])
    expect(nums).toEqual([3, 4, 6])
  })
})

describe('definitely', () => {
  it('should return an empty array by default', () => {
    expect(definitely()).toEqual([])
  })

  it('should return an array without null or void values', () => {
    const arr = [1, 2, undefined, 3, null, 4]
    expect(definitely(arr)).toEqual([1, 2, 3, 4])
  })
})
