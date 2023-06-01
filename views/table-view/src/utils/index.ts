import { useRef, useEffect, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

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

type UseEntryProps = {
  perspective: PerspectiveProxy;
  subjectInstance: string;
  source: string;
};

export function useChildren({
  perspective,
  subjectInstance,
  source,
}: UseEntryProps) {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    const callback = () => {
      fetchEntries(perspective, subjectInstance, source);
      return null;
    };

    perspective.addListener("link-added", callback);
    perspective.addListener("link-removed", callback);

    return () => {
      perspective.removeListener("link-added", callback);
      perspective.removeListener("link-removed", callback);
    };
  }, [perspective.uuid, subjectInstance, source]);

  useEffect(() => {
    fetchEntries(perspective, subjectInstance, source);
  }, [subjectInstance, perspective.uuid, source]);

  function fetchEntries(p, name, s) {
    if (name) {
      p.infer(
        `subject_class("${name}", C), instance(C, Base), triple("${s}", Predicate, Base).`
      )
        .then(async (result) => {
          if (result) {
            const uniqueResults = [...new Set(result.map((r) => r.Base))];
            const entries = await Promise.all(
              uniqueResults.map((base: string) => p.getSubjectProxy(base, name))
            );

            const resolved = await getEntries(entries);
            setEntries(resolved);
          } else {
            setEntries([]);
          }
        })
        .catch((e) => {
          setEntries([]);
        });
    } else {
      setEntries([]);
    }
  }

  return { entries };
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
