import styles from "./index.scss";

export default function LinkCard({ name, description, onClick, image }) {
  const truncatedDescription = description.length > 80 ? `${description.substring(0, 79)}...` : description;
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <small class={styles.neighbourhoodCardTitle}>Link</small>
        <div class={styles.neighbourhoodCardFlex}>
          {image && <img src={image} width={100} height={100} />}
          <div>
            <div class={styles.neighbourhoodCardName}>
              {name || "No title"}
            </div>
            <div class={styles.neighbourhoodCardDescription}>
              {truncatedDescription || "No descriptioon"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
