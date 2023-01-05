import styles from "./index.scss";

export default function LinkCard({ name, description, onClick, image }) {
  const truncatedDescription = description.length > 80 ? `${description.substring(0, 79)}...` : description;
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <div class={styles.neighbourhoodCardFlex}>
          <div>
            <div class={styles.neighbourhoodCardName}>
              {name || "No title"}
            </div>
            <div class={styles.neighbourhoodCardDescription}>
              {truncatedDescription || "No descriptioon"}
            </div>
          </div>
          {image && <img class={styles.neighbourhoodCardImage} src={image} width={140} />}
        </div>
      </div>
    </div>
  );
}
