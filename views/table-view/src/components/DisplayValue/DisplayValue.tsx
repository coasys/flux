import { useState } from "preact/hooks";
import { isValidUrl } from "../../utils";
import { Literal } from "@perspect3vism/ad4m";
import styles from "./DisplayValue.module.css";

type Props = {
  value: any;
  onUrlClick?: Function;
};

export default function DisplayValue({ value, onUrlClick = () => {} }: Props) {
  const isCollection = Array.isArray(value);

  if (isCollection) {
    return (
      <j-flex gap="200" wrap>
        {value.map((v, index) => {
          return <DisplayValue onUrlClick={onUrlClick} value={v} />;
        })}
      </j-flex>
    );
  }

  if (typeof value === "string") {
    if (value.length > 1000)
      return (
        <img className={styles.img} src={`data:image/png;base64,${value}`} />
      );
    if (isValidUrl(value)) {
      if (value.startsWith("literal://")) {
        console.log({ value });
        return (
          <a
            className={styles.entryUrl}
            href={value}
            onClick={() => onUrlClick(value)}
          >
            {Literal.fromUrl(value).get()}
          </a>
        );
      }

      return (
        <a
          className={styles.entryUrl}
          href={value}
          onClick={() => onUrlClick(value)}
        >
          {value}
        </a>
      );
    }

    if (value.startsWith("did:key")) {
      return (
        <div>
          <j-avatar size="xs" hash={value}></j-avatar>
        </div>
      );
    }
    return <span>{value}</span>;
  }

  if (value?.constructor?.name === "Object") {
    return <ShowObjectInfo value={value} />;
  }

  if (value === true) return <j-toggle size="sm" checked></j-toggle>;

  if (value === false) return <span></span>;

  return value === null ? <span></span> : value;
}

function ShowObjectInfo({ value }) {
  const [open, setOpen] = useState(false);

  const properties = Object.entries(value);

  function onClick(e) {
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <div>
      <j-button variant="subtle" size="xs" onClick={onClick}>
        Show
      </j-button>
      {open && (
        <j-modal
          open={open}
          onClick={(e) => e.stopImmediatePropagation()}
          onToggle={(e) => setOpen(e.target.open)}
        >
          <j-box p="500">
            <j-flex p="500" direction="column" gap="400">
              {properties.map(([key, value]) => (
                <j-flex gap="100" direction="column">
                  <j-text size="300" uppercase nomargin>
                    {key}
                  </j-text>
                  <DisplayValue value={value} />
                </j-flex>
              ))}
            </j-flex>
          </j-box>
        </j-modal>
      )}
    </div>
  );
}
