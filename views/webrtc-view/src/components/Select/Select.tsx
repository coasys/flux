import classNames from "classnames";

import styles from "./Select.module.css";

export type SelectOption = {
  text: string;
  order?: number;
  value: number | string | undefined;
  disabled?: boolean;
  ariaLabel?: string;
};

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  selected?: string | number | undefined;
  options?: SelectOption[];
  full?: boolean;
  error?: string;
  success?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  monochrome?: boolean;
  autoFocus?: boolean;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

const Select: React.FC<Props> = ({
  name,
  label,
  placeholder = "",
  selected,
  options = [],
  onChange,
  onBlur,
  full,
  error,
  success,
  hideLabel,
  disabled,
  monochrome,
  autoFocus,
}) => {
  const showFeedback = error || success;

  const selectClass = classNames({
    [styles["select"]]: true,
    [styles["-full"]]: full,
    [styles["-error"]]: error,
    [styles["-show-message"]]: showFeedback,
    [styles["-disabled"]]: disabled,
    [styles["-monochrome"]]: monochrome,
  });

  const selectedOption = options.find(
    (o) => String(o.value) === String(selected)
  );

  return (
    <div className={selectClass}>
      {label && !hideLabel && (
        <div className={styles.label}>
          <label htmlFor={name}>
            <j-text variant="body">{label}</j-text>
          </label>
        </div>
      )}
      <div className={styles.wrapper}>
        <select
          id={`select-${name}`}
          name={name}
          className={styles.field}
          value={selected}
          onChange={onChange}
          onBlur={onBlur}
          aria-label={hideLabel ? label : undefined}
          disabled={disabled}
          autoFocus={autoFocus}
        >
          <option hidden value="">
            {placeholder || "Velg"}
          </option>
          {options
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .filter((option) => !option.disabled)
            .map((option, i) => (
              <option
                key={`${name}-${option.value}-${option.text}-${i}`}
                value={String(option.value)}
                disabled={option.disabled}
                aria-label={option.ariaLabel}
              >
                {option.text}
              </option>
            ))}
        </select>
        <div className={styles.placeholder} aria-hidden>
          {selectedOption ? selectedOption.text : placeholder}
        </div>
        <div className={styles.arrow}>
          <j-icon name="chevron-down" size="xs"></j-icon>
        </div>
      </div>
      {showFeedback && (
        <div id={`input-${name}-feedback`}>
          <div className={styles.message} aria-live="polite">
            <p className="sr">
              {error && `${error && "Error: "}${placeholder}`}
            </p>
            {error || success}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
