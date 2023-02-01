import styles from "./index.scss";

export default function Header({channel}: {channel: string}) {

  return <header class={styles.header}># {channel}</header>;
}
