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
  cameraEnabled?: boolean;
  videoRef?: React.MutableRefObject<null>;
};

export default function Item({ data, cameraEnabled, videoRef }: Props) {
  return (
    <div className={styles.item} data-camera-enabled={cameraEnabled}>
      <video
        ref={videoRef}
        className={styles.video}
        id={`user-video-${data.id}`}
        autoPlay
        playsInline
      ></video>

      <div className={styles.details}>
        <j-avatar initials={data.name.charAt(0)}></j-avatar>
        <j-text>{data.name}</j-text>
      </div>
    </div>
  );
}
