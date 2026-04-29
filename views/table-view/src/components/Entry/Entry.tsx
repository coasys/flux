import { useEffect, useState } from 'preact/hooks';
import { PerspectiveProxy, Literal, Link, LinkQuery } from '@coasys/ad4m';
import DisplayValue from '../DisplayValue';
import styles from './Entry.module.css';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick?: Function;
};

export default function Entry({ perspective, source, onUrlClick = () => {} }: Props) {
  const [entry, setEntry] = useState({});
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchSourceClasses(source);
  }, [source, perspective.uuid]);

  async function fetchSourceClasses(source) {
    const classResults = await perspective.getInstanceClasses(source);

    if (classResults?.length > 0) {
      setClasses(classResults);
      const className = classResults[0];
      const data = await perspective.getSubjectData(className, source);
      setEntry({ id: source, ...data });
    } else {
      setClasses([]);
      setEntry({ id: source });
    }
  }

  async function onUpdate(propName, value) {
    const className = classes[0];
    if (className) {
      const shape = await perspective.getClassShape(className);
      const prop = shape?.properties.find(p => p.name === propName);
      if (prop) {
        const oldLinks = await perspective.get(new LinkQuery({ source, predicate: prop.predicate }));
        for (const link of oldLinks) {
          await perspective.remove(link);
        }
        await perspective.add(new Link({ source, predicate: prop.predicate, target: value }));
        const data = await perspective.getSubjectData(className, source);
        setEntry({ id: source, ...data });
      }
    }
  }

  if (entry) {
    const properties = Object.entries(entry);
    const defaultName =
      entry?.name || entry?.title || (source?.startsWith('literal://') && Literal.fromUrl(source).get()) || source;

    return (
      <div>
        <j-flex gap="200" direction="column">
          <j-text color="primary-500" uppercase weight="bold" size="300">
            {classes.toString()}
          </j-text>
        </j-flex>
        <j-box pt="100" pb="800">
          <h2 className={styles.entryTitle} onClick={() => onUrlClick(source, true)}>
            {defaultName}
          </h2>
        </j-box>

        <j-flex direction="column" gap="500">
          {properties.map(([key, value]) => (
            <j-flex gap="200" direction="column">
              <j-text style="text-transform: capitalize" size="300" nomargin>
                {key}
              </j-text>
              <j-text nomargin color="black">
                <DisplayValue onUpdate={(value) => onUpdate(key, value)} onUrlClick={onUrlClick} value={value} />
              </j-text>
            </j-flex>
          ))}
        </j-flex>

        <j-box pt="800">
          <j-button size="lg" variant="primary" onClick={() => onUrlClick(source, true)}>
            Go to {classes[0]}
          </j-button>
        </j-box>
      </div>
    );
  }

  return <span>{source}</span>;
}
