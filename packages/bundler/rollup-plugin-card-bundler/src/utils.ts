export function asyncMap<T, O>(arr: T[], asyncFn: (t: T) => Promise<O>): Promise<O[]> {
  return Promise.all(arr.map(asyncFn))
}

export async function asyncFlatMap<T, O>(arr: T[], asyncFn: (t: T) => Promise<O[]>): Promise<O[]> {
  return Promise.all((await asyncMap(arr, asyncFn)).flat())
}
