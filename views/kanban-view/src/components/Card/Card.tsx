import { useEntry } from "@fluxapp/react-web/src";
import styles from "./Card.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

type Props = {
  id: string;
  onClick: () => void;
  perspective: PerspectiveProxy;
  selectedClass: string;
};

export default function Card({
  id,
  onClick,
  selectedClass,
  perspective,
}: Props) {
  const { entry } = useEntry({ perspective, id, model: selectedClass });

  return (
    <div className={styles.card} onClick={onClick}>
      <j-text size="500" nomargin>
        {entry?.name || entry?.title || "Unnamed"}
      </j-text>
      <j-icon
        color="ui-400"
        className={styles.editIcon}
        size="sm"
        name="pencil"
      ></j-icon>
    </div>
  );
}
