/* weird eslint bug */
/* eslint-disble-next-line */
import { Maybe } from '../types'

export const flat = <T>(arrays: T[][]): T[] =>
  arrays.reduce<T[]>((flattened, array) => [...flattened, ...array], [])

/**
 * unique.
 *
 * @param {T[]} arr
 * @returns {T[]}
 */
export const unique = <T>(arr: T[]): T[] =>
  arr.reduce<T[]>((allItems, currentItem) => {
    if (allItems.includes(currentItem)) return allItems
    return [...allItems, currentItem]
  }, [])

/* yanked from:
 * https://stackoverflow.com/questions/8495687/split-array-into-chunks */
export const chunk = <T>(arr: T[], size: number): T[][] =>
  [...Array(Math.ceil(arr.length / size))]
    .fill(undefined)
    .map((_, i) => arr.slice(size * i, size + size * i))

/* yanked and adapted from:
 * https://stackoverflow.com/questions/11731072/dividing-an-array-by-filter-function */

type PredicateFn<T1, T2> = (item: T1 | T2) => item is T1
type Partitioned<T1, T2> = [T1[], T2[]]

/**
 * partition.
 *
 * @param array - An array of items to partition
 * @param predicate - A function that will return true or false for each item
 */
export function partition<T1, T2>(
  array: Array<T1 | T2>,
  predicate: PredicateFn<T1, T2>
): Partitioned<T1, T2> {
  return array.reduce<Partitioned<T1, T2>>(
    (acc, item) =>
      predicate(item) ? (acc[0].push(item), acc) : (acc[1].push(item), acc),
    [[], []]
  )
}

export function definitely<T>(items?: Maybe<T>[] | null): T[] {
  if (!items) return []
  return items.filter((i): i is T => Boolean(i))
}
