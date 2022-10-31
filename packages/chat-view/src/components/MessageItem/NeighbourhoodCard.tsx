import styles from "./index.scss";

export default function NeighbourhoodCard({ name, description, onClick }) {
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <div>
          <div>Neighbourhood</div>
          <div nomargin color="black" size="500" weight="600">
            {name || "Unknown Community"}
          </div>
          <div nomargin size="500" weight="400" color="ui-600">
            {description || "No descriptioon"}
          </div>
        </div>
        <j-button variant="primary">Join</j-button>
      </div>
    </div>
  );
}
