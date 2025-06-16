import { Ad4mModel, PerspectiveProxy } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import DisplayValue from "../DisplayValue";

type Props = {
  perspective: PerspectiveProxy;
  task: Ad4mModel;
  channelId: string;
  selectedClass: string;
  onUrlClick?: Function;
};

export default function Entry({
  perspective,
  task,
  channelId,
  selectedClass,
  onUrlClick = () => {},
}: Props) {
  const [namedOptions, setNamedOptions] = useState({});

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
    task[propName] = value;
    await task.update();
  }

  if (task) {
    const properties = Object.entries(task).filter(([key, value]) => {
      return !(
        key === "author" ||
        key === "timestamp" ||
        key === "id" ||
        key === "title" ||
        key === "name"
      );
    });

    const titleName = task.hasOwnProperty("name")
      ? "name"
      : task.hasOwnProperty("title")
        ? "title"
        : "";

    // @ts-ignore
    const defaultName = task?.name || task?.title || "";

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

  return <span>{task.baseExpression}</span>;
}
