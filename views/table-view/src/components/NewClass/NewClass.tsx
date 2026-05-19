import { useState } from 'preact/hooks';
import { PerspectiveProxy, SHACLShape } from '@coasys/ad4m';
import styles from './NewClass.module.css';

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
  const [name, setName] = useState('');
  const [optionName, setOptionName] = useState('');
  const [optionValue, setOptionValue] = useState('');

  const [columns, setColumns] = useState<Record<string, Column>>({
    dj4523ljd: {
      name: 'title',
      defaultValue: 'Title',
      options: [],
      language: 'literal',
      predicate: 'rdf://title',
      required: true,
    },
  });

  async function addClass() {
    const shape = await buildSHACLShape(name, columns, perspective);
    await perspective.addShacl(name, shape);
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
        options: [...columns[id].options, { name: optionName, value: optionValue }],
      },
    });

    setOptionName('');
    setOptionValue('');
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
        options: columns[id].options.map((o, i) => (i === index ? { name: value, value } : o)),
      },
    });
  }

  function addNewColumn() {
    const id = Math.random().toString(36).substring(2);
    setColumns({
      ...columns,
      [id]: {
        name: '',
        defaultValue: '',
        language: 'literal',
        predicate: '',
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

      <j-input size="xl" value={name} onchange={(e) => setName(e.target.value)}></j-input>

      <j-box pt="800" pb="300">
        <j-text size="600" weight="500">
          Properties
        </j-text>
      </j-box>

      <div className={styles.columnGrid}>
        {Object.entries(columns).map(([id, column]) => {
          return (
            <details key={id} className={styles.details}>
              <summary className={styles.summary}>
                <j-flex j="between" a="center">
                  <j-flex gap="400">
                    <j-text size="500" weight="600" nomargin>
                      {column.name || 'empty'}
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
                    onInput={(e) => updateColumn(id, 'name', e.target.value)}
                    className={styles.input}
                  ></j-input>
                  <j-input
                    size="lg"
                    label="Predicate"
                    value={column.predicate}
                    onChange={(e) => updateColumn(id, 'predicate', e.target.value)}
                    className={styles.input}
                  ></j-input>
                  <j-input
                    size="lg"
                    label="Language"
                    value={column.language}
                    onChange={(e) => updateColumn(id, 'language', e.target.value)}
                    className={styles.input}
                  ></j-input>

                  <j-flex direction="column" gap="300">
                    <j-text variant="label" nomargin>
                      Options
                    </j-text>
                    {column.options.map((option, index) => (
                      <j-flex gap="200">
                        <j-input full autofocus onchange={(e) => updateOption(id, index, e.target.value)}>
                          {option.name}
                        </j-input>
                        <j-button variant="ghost" onclick={() => removeOption(id, index)}>
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
                    onChange={(e) => updateColumn(id, 'defaultValue', e.target.value)}
                    className={styles.input}
                  ></j-input>

                  <j-toggle checked={column.required} onChange={(e) => updateColumn(id, 'required', e.target.checked)}>
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

async function buildSHACLShape(
  name: string,
  columns: Record<string, Column>,
  perspective: PerspectiveProxy,
): Promise<SHACLShape> {
  const ns = `recipe://${name}`;
  const shape = new SHACLShape(`${ns}Shape`, `${ns}#${name}`);
  const constructorActions: Array<{ action: string; source: string; predicate: string; target: string }> = [];

  for (const column of Object.values(columns)) {
    const { name: columnName, required, predicate, defaultValue, language, options } = column;

    const expression = defaultValue ? await perspective.createExpression(defaultValue, language) : undefined;

    const propShape: any = {
      name: columnName,
      path: predicate,
      datatype: 'xsd://string',
      minCount: required ? 1 : 0,
      maxCount: 1,
      writable: true,
    };

    if (language) {
      propShape.resolveLanguage = language;
    }

    if (options.length > 0) {
      propShape.in = options.map((opt) => ({ value: opt.value, label: opt.name }));
    }

    shape.addProperty(propShape);

    // Build constructor action for default value
    if (expression) {
      constructorActions.push({
        action: 'addLink',
        source: 'this',
        predicate,
        target: expression,
      });
    }
  }

  if (constructorActions.length > 0) {
    shape.setConstructorActions(constructorActions);
  }

  return shape;
}

