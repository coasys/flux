import styles from "./Item.module.css";

type StreamUser = {
  id: string;
  name: string;
  candidate: string;
  prefrences?: {
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
};

type Props = {
  data: StreamUser;
};

export default function Item({ data }: Props) {
  return (
    <div className={styles.item}>
      <j-avatar initials={data.name.charAt(0)}></j-avatar>
      <j-text>{data.name}</j-text>
    </div>
  );
}
