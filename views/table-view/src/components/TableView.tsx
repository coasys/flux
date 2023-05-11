import { useEffect, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "../App.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

async function getEntries(entries) {
  return Promise.all(
    entries.map(async (e) => {
      const getters = Object.entries(Object.getOwnPropertyDescriptors(e))
        .filter(([key, descriptor]) => typeof descriptor.get === "function")
        .map(([key]) => key);

      const promises = getters.map((getter) => e[getter]);
      return Promise.all(promises).then((values) => {
        return getters.reduce((acc, getter, index) => {
          return { ...acc, [getter]: values[index] };
        }, {});
      });
    })
  );
}

export default function TableView({ perspective, source }: Props) {
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    perspective.subjectClasses().then((c) => setClasses([...new Set(c)]));
  }, [perspective.uuid]);

  useEffect(() => {
    if (selected) {
      perspective.getAllSubjectInstances(selected).then((entries) => {
        if (Array.isArray(entries)) {
          getEntries(entries).then((e) => {
            console.log(e);
            setEntries(e);
          });
        }
      });
    }
  }, [selected]);

  return (
    <div>
      <j-tabs
        size="sm"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {classes.map((c) => {
          return <j-tab-item value={c}>{c}</j-tab-item>;
        })}
      </j-tabs>
      <j-box pt="800">
        <Table data={entries}></Table>
      </j-box>
    </div>
  );
}

function Table({ data }) {
  if (!data?.length) return null;
  // Extracting the property names from the first object in the array
  const headers = Object.keys(data[0]);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {headers.map((header, index) => (
              <td key={index}>{item[header]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
