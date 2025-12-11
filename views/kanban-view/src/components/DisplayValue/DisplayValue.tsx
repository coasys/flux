import { Literal } from '@coasys/ad4m';
import { getProfile } from '@coasys/flux-api';
import type { Profile } from '@coasys/flux-types';
import { useEffect, useRef, useState } from 'preact/hooks';
import styles from './DisplayValue.module.css';

export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

type Props = {
  value: any;
  options?: any;
  onUrlClick?: Function;
  onUpdate?: (value: string) => void;
};

export default function DisplayValue({ value, options, onUpdate, onUrlClick = () => {} }: Props) {
  const inputRef = useRef<HTMLInputElement>();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      onUpdate(e.target.value);
      setLocalValue(e.target.value);
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      setIsEditing(false);
      setLocalValue(value);
    }
  }

  function onBlur(e) {
    onUpdate(e.target.value);
    setLocalValue(e.target.value);
    setIsEditing(false);
  }

  function onStartEdit(e) {
    e.stopPropagation();
    setIsEditing(true);
  }

  const isCollection = Array.isArray(localValue);

  if (isCollection) {
    return (
      <j-flex gap="200" wrap>
        {localValue.map((v, index) => (
          <DisplayValue key={index} onUrlClick={onUrlClick} value={v} />
        ))}
      </j-flex>
    );
  }

  if (options) {
    return (
      <div className={styles.selectWrapper}>
        <select className={styles.select} value={localValue} onChange={(e) => onUpdate(e.target.value)}>
          {options.map((option) => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
        <j-icon name="chevron-down" size="xs" />
      </div>
    );
  }

  if (isEditing && onUpdate) {
    return (
      <input
        ref={inputRef}
        className={styles.input}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        value={localValue}
      />
    );
  }

  if (typeof localValue === 'string') {
    if (localValue.startsWith('did:key')) {
      return <Profile did={localValue} />;
    }

    if (localValue.length > 1000) return <img className={styles.img} src={`data:image/png;base64,${localValue}`} />;
    if (isValidUrl(localValue)) {
      if (localValue.startsWith('literal://')) {
        return (
          <a
            className={styles.entryUrl}
            href={localValue}
            onClick={(e) => {
              e.stopPropagation();
              onUrlClick(localValue);
            }}
          >
            {Literal.fromUrl(localValue).get()}
          </a>
        );
      }

      return (
        <a
          className={styles.entryUrl}
          href={localValue}
          onClick={(e) => {
            e.stopPropagation();
            onUrlClick(localValue);
          }}
        >
          {localValue}
        </a>
      );
    }

    return (
      <j-flex gap="500" a="center">
        <div className={styles.value} onClick={onStartEdit}>
          {localValue}
        </div>
      </j-flex>
    );
  }

  if (localValue?.constructor?.name === 'Object') {
    return <ShowObjectInfo value={localValue} />;
  }

  if (localValue === true) return <j-toggle size="sm" checked />;

  if (localValue === false)
    return onUpdate ? (
      <j-button onClick={onStartEdit} square circle size="sm" variant="ghost">
        <j-icon size="xs" name="pencil" />
      </j-button>
    ) : (
      <span></span>
    );

  return localValue === null ? <span></span> : localValue;
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
          onClick={(e: any) => e.stopImmediatePropagation()}
          // @ts-ignore
          onToggle={(e) => setOpen(e.target.open)}
        >
          <j-box p="500">
            <j-flex direction="column" gap="400">
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

function Profile({ did }: { did: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfile(did).then(setProfile);
  }, [did]);

  return (
    <j-tooltip strategy="fixed" title={profile?.username}>
      <j-avatar size="xs" hash={did} src={profile?.profileThumbnailPicture} />
    </j-tooltip>
  );
}
