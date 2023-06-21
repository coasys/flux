import { useRef, useEffect } from "preact/hooks";

export async function getEntry(entry) {
  const getters = Object.entries(Object.getOwnPropertyDescriptors(entry))
    .filter(([key, descriptor]) => typeof descriptor.get === "function")
    .map(([key]) => key);

  const promises = getters.map((getter) => entry[getter]);
  return Promise.all(promises).then((values) => {
    return getters.reduce((acc, getter, index) => {
      return { ...acc, id: entry.baseExpression, [getter]: values[index] };
    }, {});
  });
}

export async function getEntries(entries) {
  return Promise.all(entries.map(getEntry));
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; //assign the value of ref to the argument
  }, [value]); //this code will run when the value of 'value' changes
  return ref.current; //in the end, return the current ref value.
}

export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

export function pluralize(word: string): string {
  const lastChar = word[word.length - 1];
  const secondLastChar = word[word.length - 2];
  if (lastChar === "y" && !isVowel(secondLastChar)) {
    return word.slice(0, -1) + "ies";
  } else if (
    lastChar === "s" ||
    lastChar === "x" ||
    lastChar === "z" ||
    (secondLastChar === "c" && lastChar === "h") ||
    (secondLastChar === "s" && lastChar === "h")
  ) {
    return word + "es";
  } else {
    return word + "s";
  }
}

export function isVowel(char: string): boolean {
  return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
}
