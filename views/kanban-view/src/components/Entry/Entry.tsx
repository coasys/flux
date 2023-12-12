import { useEffect, useState } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { useSubject } from "@coasys/flux-react-web";
import DisplayValue from "../DisplayValue";
import styles from "./Entry.module.css";

type Props = {
  perspective: PerspectiveProxy;
  id: string;
  selectedClass: string;
  onUrlClick?: Function;
};

export default function Entry({
  perspective,
  id,
  selectedClass,
  onUrlClick = () => {},
}: Props) {
  const [namedOptions, setNamedOptions] = useState({});
  const { entry, repo } = useSubject({
    perspective,
    subject: selectedClass,
    id,
  });

  useEffect(() => {
    perspective
      .infer(
        `subject_class("${selectedClass}", Atom), property_named_option(Atom, Property, Value, Label).`
      )
      .then((res) => {
        if (res?.length) {
          const options = res.reduce((acc, option) => {
            return {
              ...acc,
              [option.Property]: [
                ...(acc[option.Property] || []),
                { label: option.Label, value: option.Value },
              ],
            };
          }, {});
          setNamedOptions(options);
        }
      });
  }, [selectedClass, perspective.uuid]);

  async function onUpdate(propName, value) {
    repo.update(id, { [propName]: value });
  }

  if (entry) {
    const properties = Object.entries(entry).filter(([key, value]) => {
      return !(
        key === "author" ||
        key === "timestamp" ||
        key === "id" ||
        key === "title" ||
        key === "name"
      );
    });

    const titleName = entry.hasOwnProperty("name")
      ? "name"
      : entry.hasOwnProperty("title")
        ? "title"
        : "";

    const defaultName = entry?.name || entry?.title || "";

    return (
      <div>
        {defaultName && (
          <j-box pt="100" pb="800">
            <j-flex gap="400" direction="column">
              <j-flex gap="300" a="center">
                <j-icon name="justify-left" color="ui-500" size="xs"></j-icon>
                <j-text
                  style="text-transform: capitalize"
                  size="500"
                  weight="500"
                  nomargin
                >
                  {titleName}
                </j-text>
              </j-flex>
              <j-text size="700" weight="600" nomargin color="black">
                <DisplayValue
                  onUpdate={(value) => onUpdate(titleName, value)}
                  onUrlClick={onUrlClick}
                  value={defaultName}
                />
              </j-text>
            </j-flex>
          </j-box>
        )}

        <j-flex direction="column" gap="800">
          {properties.map(([key, value]) => (
            <j-flex gap="400" direction="column">
              <j-flex gap="300" a="center">
                <j-icon name="justify-left" color="ui-500" size="xs"></j-icon>
                <j-text
                  style="text-transform: capitalize"
                  size="500"
                  weight="600"
                  nomargin
                >
                  {key}
                </j-text>
              </j-flex>
              <j-text nomargin color="black">
                <DisplayValue
                  options={namedOptions[key]}
                  onUpdate={(value) => onUpdate(key, value)}
                  onUrlClick={onUrlClick}
                  value={value}
                />
              </j-text>
            </j-flex>
          ))}
        </j-flex>
      </div>
    );
  }

  return <span>{id}</span>;
}
