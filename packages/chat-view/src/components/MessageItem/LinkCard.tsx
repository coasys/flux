import styles from "./index.scss";

export default function LinkCard({ name, description, onClick }) {
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <small class={styles.neighbourhoodCardTitle}>Link</small>
        <div class={styles.neighbourhoodCardName}>
          {name || "No title"}
        </div>
        <div class={styles.neighbourhoodCardDescription}>
          {description || "No descriptioon"}
        </div>
      </div>
    </div>
  );
}
