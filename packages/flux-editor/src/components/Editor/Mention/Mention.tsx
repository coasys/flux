import styles from "./Mention.module.css";

export default function Mention({ attributes, children, element }) {
  return (
    <span
      {...attributes}
      contentEditable={false}
      className={styles.mention}
      data-mention={`${element.person.username}`}
    >
      @{element.person.username}
      {children}
    </span>
  );
}
