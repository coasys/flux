import { useState, useEffect } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { getEntry } from "../../utils";
import DisplayValue from "../DisplayValue";
import styles from "./Header.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick?: Function;
};

export default function Header({
  perspective,
  source,
  onUrlClick = () => {},
}: Props) {
  const [entry, setEntry] = useState({});
  const [classes, setClasses] = useState([]);
  const [proxy, setProxy] = useState();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchSourceClasses(source);
  }, [source, perspective.uuid]);

  async function fetchSourceClasses(source) {
    const classResults = await perspective.infer(
      `subject_class(ClassName, C), instance(C, "${source}").`
    );

    if (classResults?.length > 0) {
      setClasses(classResults.map((c) => c.ClassName));
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
    const properties = Object.entries(entry).filter(
      ([key, value]) => !(key === "id" || key === "type")
    );

    const defaultName =
      entry?.name ||
      entry?.title ||
      (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
      source;

    return (
      <div>
        <details
          open={isExpanded}
          onToggle={(e) => setIsExpanded(e.target.open)}
          className={styles.details}
        >
          <summary>
            <j-flex a="end" gap="400">
              <div>
                <j-box pb="200">
                  <j-text
                    uppercase
                    nomargin
                    size="200"
                    weight="800"
                    color="white"
                  >
                    Current Entry
                  </j-text>
                </j-box>
                <j-text nomargin variant="heading" color="white">
                  {defaultName}
                </j-text>
              </div>
              <j-icon
                size="sm"
                name={isExpanded ? "chevron-down" : "chevron-right"}
              ></j-icon>
            </j-flex>
          </summary>
          <j-box pt="500">
            <j-flex direction="row" gap="500" wrap>
              {properties.map(([key, value]) => (
                <j-flex gap="200" direction="column">
                  <j-text color="white" size="200" uppercase nomargin>
                    {key}
                  </j-text>
                  <div>
                    <DisplayValue
                      onUpdate={(value) => onUpdate(key, value)}
                      onUrlClick={onUrlClick}
                      value={value}
                    />
                  </div>
                </j-flex>
              ))}
            </j-flex>
          </j-box>
        </details>
      </div>
    );
  }

  return <span>{source}</span>;
}
