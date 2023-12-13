import { useEffect, useState } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@coasys/ad4m";
import { getEntry } from "../../utils";
import DisplayValue from "../DisplayValue";
import styles from "./Entry.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick?: Function;
};

export default function Entry({
  perspective,
  source,
  onUrlClick = () => {},
}: Props) {
  const [proxy, setProxy] = useState();
  const [entry, setEntry] = useState({});
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchSourceClasses(source);
  }, [source, perspective.uuid]);

  async function fetchSourceClasses(source) {
    const classResults = await perspective.infer(
      `subject_class(ClassName, C), instance(C, "${source}").`
    );

    if (classResults?.length > 0) {
      setClasses([...new Set(classResults.map((c) => c.ClassName))]);
      const className = classResults[0].ClassName;
      const subjectProxy = await perspective.getSubjectProxy(source, className);
      setProxy(subjectProxy);
      const entry = await getEntry(subjectProxy);
      setEntry(entry);
    } else {
      setClasses([]);
      setEntry({ id: source });
    }
  }

  async function onUpdate(propName, value) {
    if (proxy) {
      await proxy.init();
      const capitalized = propName.charAt(0).toUpperCase() + propName.slice(1);
      await proxy[`set${capitalized}`](value);
      const entry = await getEntry(proxy);
      setEntry(entry);
    }
  }

  if (entry) {
    const properties = Object.entries(entry);
    const defaultName =
      entry?.name ||
      entry?.title ||
      (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
      source;

    return (
      <div>
        <j-flex gap="200" direction="column">
          <j-text color="primary-500" uppercase weight="bold" size="300">
            {classes.toString()}
          </j-text>
        </j-flex>
        <j-box pt="100" pb="800">
          <h2
            className={styles.entryTitle}
            onClick={() => onUrlClick(source, true)}
          >
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
                <DisplayValue
                  onUpdate={(value) => onUpdate(key, value)}
                  onUrlClick={onUrlClick}
                  value={value}
                />
              </j-text>
            </j-flex>
          ))}
        </j-flex>

        <j-box pt="800">
          <j-button
            size="lg"
            variant="primary"
            onClick={() => onUrlClick(source, true)}
          >
            Go to {classes[0]}
          </j-button>
        </j-box>
      </div>
    );
  }

  return <span>{source}</span>;
}
