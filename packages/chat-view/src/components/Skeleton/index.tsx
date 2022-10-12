import styles from "./index.scss";

export default function Skeleton({ width = '100%', height = 20, variant = 'rectangle' }: any) {
  return (
    <div
      class={`${styles.skeleton} ${variant === 'circle' ? styles.skeletonCircle : ''}`}
      style={{ width, height }}
    ></div>
  );
}
