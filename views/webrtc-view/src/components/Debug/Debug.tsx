import { Profile } from "@coasys/flux-types";
import { WebRTC } from "@coasys/flux-react-web";
import UiContext from "../../context/UiContext";
import { useContext } from "preact/hooks";

import Item from "./Item";
import ItemMe from "./ItemMe";

import styles from "./Debug.module.css";

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
};

export default function Debugger({ webRTC, profile }: Props) {
  const {
    methods: { toggleShowDebug },
  } = useContext(UiContext);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <ul className={styles.list}>
          <li>
            <ItemMe profile={profile} webRTC={webRTC} />
          </li>
          {webRTC.connections.map((p, i) => (
            <li key={p.did}>
              <Item index={i + 2} peer={p} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.close}>
        <j-button
          variant={"secondary"}
          onClick={() => toggleShowDebug(false)}
          square
          circle
          size="lg"
        >
          <j-icon name="x-lg"></j-icon>
        </j-button>
      </div>
    </div>
  );
}
