import { useMemo } from "preact/hooks";
import styles from "./index.scss";

export default function MessageCard({
  name,
  description,
  image,
  isLoading,
  showJoinButton,
  onClick,
}) {
  const activeClass = useMemo(() => {
    return [
      styles.neighbourhoodCard,
      isLoading ? styles.neighbourhoodCardLoading : "",
    ].join(" ");
  }, [isLoading]);

  const truncatedDescription =
    description?.length > 80
      ? `${description.substring(0, 79)}...`
      : description;

  return (
    <div class={activeClass} size="300" onClick={onClick}>
      <div>
        <div class={styles.neighbourhoodCardFlex}>
          <div>
            <div class={styles.neighbourhoodCardName}>
              {isLoading ? (
                <j-skeleton width="lg" height="text"></j-skeleton>
              ) : (
                name || "No title"
              )}
            </div>
            <div class={styles.neighbourhoodCardDescription}>
              {isLoading ? (
                <j-skeleton width="xxl" height="text"></j-skeleton>
              ) : (
                truncatedDescription || "No descriptioon"
              )}
            </div>
          </div>
          {image && (
            <img
              class={styles.neighbourhoodCardImage}
              src={image}
              width={140}
            />
          )}
        </div>
      </div>
      {showJoinButton && !isLoading && (
        <j-button variant="primary">Join</j-button>
      )}
    </div>
  );
}
