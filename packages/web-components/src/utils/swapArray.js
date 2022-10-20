export default function swapArray(items, firstIndex, secondIndex) {
  const result = [...items];
  [result[firstIndex], result[secondIndex]] = [
    result[secondIndex],
    result[firstIndex],
  ];
  return result;
}
