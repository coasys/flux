import styles from "./index.scss";

export default function NeighbourhoodCard({ name, description, onClick }) {
  return (
    <div class={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <j-flex a="center" j="between" gap="900">
        <div>
          <j-text variant="footnote">Neighbourhood</j-text>
          <j-text nomargin color="black" size="500" weight="600">
            {name || "Unknown Community"}
          </j-text>
          <j-text nomargin size="500" weight="400" color="ui-600">
            {description || "No descriptioon"}
          </j-text>
        </div>
        <j-button variant="primary">Join</j-button>
      </j-flex>
    </div>
  );
}
