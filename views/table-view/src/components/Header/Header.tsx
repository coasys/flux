import { useState, useEffect } from 'preact/hooks';
import { PerspectiveProxy, Literal, Link, LinkQuery } from '@coasys/ad4m';
import DisplayValue from '../DisplayValue';
import styles from './Header.module.css';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick?: Function;
};

export default function Header({ perspective, source, onUrlClick = () => {} }: Props) {
  const [entry, setEntry] = useState({});
  const [classes, setClasses] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
    // Use getSubjectData to get current state, apply update via link manipulation
    const className = classes[0];
    if (className) {
      const shape = await perspective.getClassShape(className);
      const prop = shape?.properties.find(p => p.name === propName);
      if (prop) {
        // Update by setting the property value via link manipulation
        const oldLinks = await perspective.get(new LinkQuery({ source, predicate: prop.predicate }));
        for (const link of oldLinks) {
          await perspective.remove(link);
        }
        await perspective.add(new Link({ source, predicate: prop.predicate, target: value }));
        // Refresh
        const data = await perspective.getSubjectData(className, source);
        setEntry({ id: source, ...data });
      }
    }
  }

  if (entry) {
    const properties = Object.entries(entry).filter(([key, value]) => !(key === 'id' || key === 'type'));

    const defaultName =
      entry?.name || entry?.title || (source?.startsWith('literal://') && Literal.fromUrl(source).get()) || source;

    return (
      <j-box pt="500">
        <j-flex a="end" gap="400">
          <div>
            <j-box pb="200">
              <j-text uppercase nomargin size="200" weight="800" color="white">
                Current Entry
              </j-text>
            </j-box>
            <j-text nomargin variant="heading-lg" color="white">
              {defaultName}
            </j-text>
          </div>
          <j-button square size="sm" variant="ghost" onclick={() => onUrlClick(entry.id, false)}>
            <j-icon color="white" size="xs" name="arrows-angle-expand"></j-icon>
          </j-button>
        </j-flex>
      </j-box>
    );
  }

  return <span>{source}</span>;
}
