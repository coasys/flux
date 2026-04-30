export function upsertById<T extends { id: string }>(items: readonly T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) return [...items, next];

  const clone = items.slice();
  clone[index] = next;
  return clone;
}
