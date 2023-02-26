import styles from "./Disclaimer.module.css";

export default function Disclaimer() {
  return (
    <div className={styles.wrapper}>
      <j-flex a="center" gap="300">
        <j-icon name="exclamation-circle" size="xs" color="warning-500" />
        <j-text size="400" nomargin color="warning-500">
          This is a beta feature
        </j-text>
      </j-flex>
      <j-text size="300" nomargin color="warning-500">
        We use external STUN servers to establish the connection. Any further
        communication is peer-to-peer.
      </j-text>
    </div>
  );
}
