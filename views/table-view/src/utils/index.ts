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
    if (subjectInstance) {
      perspective
        .infer(
          `subject_class("${subjectInstance}", C), instance(C, Base), triple( "${source}", Predicate, Base).`
        )
        .then(async (result) => {
          if (result) {
            const uniqueResults = [...new Set(result.map((r) => r.Base))];
            const entries = await Promise.all(
              uniqueResults.map((base: string) =>
                perspective.getSubjectProxy(base, subjectInstance)
              )
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
  }, [subjectInstance, perspective.uuid, source]);

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
