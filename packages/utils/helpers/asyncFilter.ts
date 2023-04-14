export async function asyncFilter(arr: any[], callback: (item: any) => Promise<boolean>) {
  const fail = Symbol()
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
}