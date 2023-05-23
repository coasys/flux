import { useState, useEffect } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { getEntry } from "../../utils";

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
      const entry = await getEntry(subjectProxy);

      setEntry(entry);
    } else {
      setClasses([]);
      setEntry({ id: source });
    }
  }

  if (entry) {
    const defaultName =
      entry?.name ||
      entry?.title ||
      (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
      source;

    return (
      <div>
        <j-button variant="subtle" onclick={() => onUrlClick(source)}>
          <j-text nomargin variant="heading" color="white">
            {defaultName}
          </j-text>
          <j-icon
            color="white"
            size="xs"
            slot="end"
            name="arrows-angle-expand"
          ></j-icon>
        </j-button>
      </div>
    );
  }

  return <span>{source}</span>;
}
