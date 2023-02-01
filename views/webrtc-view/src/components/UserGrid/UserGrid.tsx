import { useEffect, useContext, useState } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";
import Item from "./Item";

import styles from "./UserGrid.module.css";

export default function UserGrid() {
  const {
    state: { currentUser, participants },
  } = useContext(WebRTCContext);

  return (
    <section className={styles.grid}>
      {currentUser && <Item data={currentUser} />}
      {participants.map((p) => (
        <Item key={p.id} data={p} />
      ))}
    </section>
  );
}
