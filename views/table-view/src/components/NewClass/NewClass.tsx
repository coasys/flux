import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "./NewClass.module.css";

type Props = {
  perspective: PerspectiveProxy;
  onSaved: () => void;
};

type NamedOption = {
  name: string;
  value: string;
};

type Column = {
  name: string;
  predicate: string;
  required: boolean;
  options: NamedOption[];
  defaultValue: string;
  language: string;
};

export default function NewClass({ perspective, onSaved }: Props) {
  const [name, setName] = useState("");
  const [optionName, setOptionName] = useState("");
  const [optionValue, setOptionValue] = useState("");

  const [columns, setColumns] = useState<Record<string, Column>>({
    dj4523ljd: {
      name: "name",
      defaultValue: "Title",
      options: [],
      language: "literal",
      predicate: "rdf://name",
      required: true,
    },
  });

  async function addClass() {
    const sdna = await generateSDNA(name, columns, perspective);
    console.log({ sdna });
    await perspective.addSdna(sdna);
    onSaved();
  }

  function updateColumn(id, name, value) {
    setColumns({ ...columns, [id]: { ...columns[id], [name]: value } });
  }

  function removeColumn(id) {
    const updatedColumns = { ...columns };
    delete updatedColumns[id];
    setColumns(updatedColumns);
  }

  function addOption(id) {
    setColumns({
      ...columns,
      [id]: {
        ...columns[id],
        options: [
          ...columns[id].options,
          { name: optionName, value: optionValue },
        ],
      },
    });

    setOptionName("");
    setOptionValue("");
  }

  function removeOption(id, index) {
    setColumns({
      ...columns,
      [id]: {
        ...columns[id],
        options: columns[id].options.filter((o, i) => i !== index),
      },
    });
  }

  function updateOption(id, index, value) {
    setColumns({
      ...columns,
      [id]: {
        ...columns[id],
        options: columns[id].options.map((o, i) =>
          i === index ? { name: value, value } : o
        ),
      },
    });
  }

  function addNewColumn() {
    const id = Math.random().toString(36).substring(2);
    setColumns({
      ...columns,
      [id]: {
        name: "",
        defaultValue: "",
        language: "literal",
        predicate: "",
        required: false,
        options: [],
      },
    });
  }

  return (
    <div>
      <j-box pb="500">
        <j-text variant="heading">Create Social DNA</j-text>
      </j-box>

      <j-box pt="800" pb="300">
        <j-text size="600" weight="500">
          Name
        </j-text>
      </j-box>

      <j-input
        size="xl"
        value={name}
        onchange={(e) => setName(e.target.value)}
      ></j-input>

      <j-box pt="800" pb="300">
        <j-text size="600" weight="500">
          Properties
        </j-text>
      </j-box>

      <div className={styles.columnGrid}>
        {Object.entries(columns).map(([id, column]) => {
          return (
            <details open key={id} className={styles.details}>
              <summary className={styles.summary}>
                <j-flex j="between" a="center">
                  <j-flex gap="400">
                    <j-text size="500" weight="600" nomargin>
                      {column.name || "empty"}
                    </j-text>
                    {column.required && <j-badge size="sm">Required</j-badge>}
                  </j-flex>
                  <j-button onclick={() => removeColumn(id)} variant="ghost">
                    <j-icon name="x"></j-icon>
                  </j-button>
                </j-flex>
              </summary>
              <j-box pt="500">
                <j-flex direction="column" gap="600">
                  <j-input
                    label="Name"
                    size="lg"
                    value={column.name}
                    onInput={(e) => updateColumn(id, "name", e.target.value)}
                    className={styles.input}
                  ></j-input>
                  <j-input
                    size="lg"
                    label="Predicate"
                    value={column.predicate}
                    onChange={(e) =>
                      updateColumn(id, "predicate", e.target.value)
                    }
                    className={styles.input}
                  ></j-input>
                  <j-input
                    size="lg"
                    label="Language"
                    value={column.language}
                    onChange={(e) =>
                      updateColumn(id, "language", e.target.value)
                    }
                    className={styles.input}
                  ></j-input>

                  <j-flex direction="column" gap="300">
                    <j-text variant="label" nomargin>
                      Options
                    </j-text>
                    {column.options.map((option, index) => (
                      <j-flex gap="200">
                        <j-input
                          full
                          autofocus
                          onchange={(e) =>
                            updateOption(id, index, e.target.value)
                          }
                        >
                          {option.name}
                        </j-input>
                        <j-button
                          variant="ghost"
                          onclick={() => removeOption(id, index)}
                        >
                          <j-icon name="x"></j-icon>
                        </j-button>
                      </j-flex>
                    ))}

                    <j-button variant="link" onClick={() => addOption(id)}>
                      Add option
                      <j-icon name="plus" slot="start"></j-icon>
                    </j-button>
                  </j-flex>

                  <j-input
                    size="lg"
                    label="Default value"
                    value={column.defaultValue}
                    onChange={(e) =>
                      updateColumn(id, "defaultValue", e.target.value)
                    }
                    className={styles.input}
                  ></j-input>

                  <j-toggle
                    checked={column.required}
                    onChange={(e) =>
                      updateColumn(id, "required", e.target.checked)
                    }
                  >
                    Required
                  </j-toggle>
                </j-flex>
              </j-box>
            </details>
          );
        })}
      </div>

      <j-box pt="500">
        <j-flex>
          <j-button variant="link" onclick={addNewColumn}>
            New column
            <j-icon slot="start" name="plus" size="sm"></j-icon>
          </j-button>
        </j-flex>
      </j-box>

      <j-box>
        <j-flex gap="200" j="end">
          <j-button variant="link" onclick={addNewColumn}>
            Cancel
          </j-button>
          <j-button variant="primary" onclick={addClass}>
            Save
          </j-button>
        </j-flex>
      </j-box>
    </div>
  );
}

async function generateSDNA(
  name: string,
  columns: Record<string, Column>,
  perspective: PerspectiveProxy
): Promise<string> {
  const atom = makeRandomPrologAtom(6);
  let constructorActions = "";
  let instancePredicates = "";
  let propertiesString = "";

  for await (const column of Object.values(columns)) {
    const {
      name: columnName,
      required,
      predicate,
      defaultValue,
      language,
    } = column;

    const expression = await perspective.createExpression(
      defaultValue,
      language
    );

    if (defaultValue) {
      constructorActions += `{action: "addLink", source: "this", predicate: "${predicate}", target: "${expression}"},`;
    }

    if (required) {
      instancePredicates += `triple(Base, "${predicate}", _),`;
    }

    /*
    if (required && column.options.length > 0) {
      for (const option of column.options) {
        instancePredicates += `triple(Base, "${predicate}", "${option.value}");`;
      }
    }
    */

    let namedOptionsString = "";

    for (const option of column.options) {
      namedOptionsString += `property_named_option(${atom}, "${columnName}", "${option.value}", "${option.name}").\n`;
    }

    propertiesString += `
        property(${atom}, "${columnName}").
        property_resolve(${atom}, "${columnName}").
        property_resolve_language(${atom}, "${columnName}", "${language}").
        property_getter(${atom}, Base, "${columnName}", Value) :- triple(Base, "${predicate}", Value).
        property_setter(${atom}, "${columnName}", '[{action: "setSingleTarget", source: "this", predicate: "${predicate}", target: "value"}]').
        ${namedOptionsString}
    `;
  }

  // Replace the last comma with a space to format the Prolog string properly
  constructorActions = constructorActions.replace(/,*$/, "");
  instancePredicates = instancePredicates.replace(/,*$/, "");
  // Replace the or operator (;)
  instancePredicates = instancePredicates.replace(/;*$/, "");

  const prologString = `
    subject_class("${name}", ${atom}).
    constructor(${atom}, '[${constructorActions}]').
    instance(${atom}, Base) :- ${instancePredicates}.
    ${propertiesString}
  `;

  return prologString;
}

export function makeRandomPrologAtom(length: number): string {
  let result = "";
  let characters = "abcdefghijklmnopqrstuvwxyz";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
