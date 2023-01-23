import { useMemo } from "preact/hooks";
import styles from "./index.scss";

export default function NeighbourhoodCard({
  isLoading,
  name,
  description,
  onClick,
  perspectiveUuid,
}) {
  const activeClass = useMemo(() => {
    return [
      styles.neighbourhoodCard,
      isLoading ? styles.neighbourhoodCardLoading : "",
    ].join(" ");
  }, [isLoading]);

  return (
    <div class={activeClass} size="300" onClick={onClick}>
      <div>
        <div class={styles.neighbourhoodCardName}>
          {isLoading ? (
            <j-skeleton width="lg" height="text"></j-skeleton>
          ) : (
            name || "Unknown Community"
          )}
        </div>
        <div class={styles.neighbourhoodCardDescription}>
          {isLoading ? (
            <j-skeleton width="xxl" height="text"></j-skeleton>
          ) : (
            description || "No descriptioon"
          )}
        </div>
      </div>
      {!perspectiveUuid && !isLoading && (
        <j-button variant="primary">Join</j-button>
      )}
    </div>
  );
}
