import styles from "./index.scss";

export default function NeighbourhoodCard({ name, description, onClick, perspectiveUuid }) {
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <small class={styles.neighbourhoodCardTitle}>Neighbourhood</small>
        <div class={styles.neighbourhoodCardName}>
          {name || "Unknown Community"}
        </div>
        <div class={styles.neighbourhoodCardDescription}>
          {description || "No descriptioon"}
        </div>
      </div>
      {!perspectiveUuid && <j-button variant="primary">Join</j-button>}
    </div>
  );
}
