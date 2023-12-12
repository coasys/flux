import { useEffect, useRef, useState } from "preact/hooks";
import { isValidDate, isValidUrl } from "../../utils";
import { Literal } from "@coasys/ad4m";
import styles from "./DisplayValue.module.css";

type Props = {
  canEdit: boolean;
  value: any;
  options?: any;
  onUrlClick?: Function;
  onUpdate?: (value: string) => void;
};

export default function DisplayValue({
  value,
  options,
  canEdit,
  onUpdate,
  onUrlClick = () => {},
}: Props) {
  const inputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current && canEdit) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.stopPropagation();
      onUpdate(e.target.value);
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  }

  function onBlur(e) {
    if (e.key !== "Escape") {
      onUpdate(e.target.value);
      setIsEditing(false);
    }
  }

  function onStartEdit(e) {
    e.stopPropagation();
    if (canEdit) {
      setIsEditing(true);
    }
  }

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

  if (options) {
    return (
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
      >
        {options.map((option) => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (isEditing && onUpdate) {
    return (
      <input
        ref={inputRef}
        size="sm"
        className={styles.input}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        value={value}
      ></input>
    );
  }

  if (typeof value === "string") {
    if (value.startsWith("did:key")) {
      return (
        <div>
          <j-avatar size="xs" hash={value}></j-avatar>
        </div>
      );
    }

    if (value.length > 1000)
      return (
        <img className={styles.img} src={`data:image/png;base64,${value}`} />
      );

    if (isValidUrl(value)) {
      if (value.startsWith("literal://")) {
        return (
          <a
            className={styles.entryUrl}
            href={value}
            onClick={(e) => {
              e.stopPropagation();
              onUrlClick(value);
            }}
          >
            {Literal.fromUrl(value).get()}
          </a>
        );
      }

      return (
        <a
          className={styles.entryUrl}
          href={value}
          onClick={(e) => {
            e.stopPropagation();
            onUrlClick(value);
          }}
        >
          {value}
        </a>
      );
    }

    return (
      <j-flex gap="200" a="center">
        <div onDoubleClick={onStartEdit}>{value}</div>
        {onUpdate && (
          <j-button
            onClick={onStartEdit}
            square
            circle
            size="sm"
            variant="ghost"
          >
            {canEdit && (
              <j-icon size="xs" color="ui-500" name="pencil-square"></j-icon>
            )}
          </j-button>
        )}
      </j-flex>
    );
  }

  if (value?.constructor?.name === "Object") {
    return <ShowObjectInfo value={value} />;
  }

  if (value === true) return <j-toggle size="sm" checked></j-toggle>;

  if (value === false)
    return onUpdate ? (
      <j-button onClick={onStartEdit} square circle size="sm" variant="ghost">
        <j-icon size="xs" color="ui-500" name="pencil-square"></j-icon>
      </j-button>
    ) : (
      <span></span>
    );

  if (value === undefined) {
    return (
      <j-flex gap="500" a="center">
        <div onDoubleClick={onStartEdit}>{value}</div>
        {onUpdate && (
          <j-button
            onClick={onStartEdit}
            square
            circle
            size="sm"
            variant="ghost"
          >
            {canEdit && (
              <j-icon size="xs" color="ui-500" name="pencil-square"></j-icon>
            )}
          </j-button>
        )}
      </j-flex>
    );
  }

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
