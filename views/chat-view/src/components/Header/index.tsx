import styles from "./index.module.css";

export default function Header({ channel }: { channel: string }) {
  return <header class={styles.header}># {channel}</header>;
}
