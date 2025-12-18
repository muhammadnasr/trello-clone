/**
 * Reorders an array by moving an item from one index to another.
 * Standard @hello-pangea/dnd pattern.
 */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

