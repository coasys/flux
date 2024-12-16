import styles from "./PercentageRing.module.scss";

type Props = {
  ringSize: number;
  fontSize: number;
  score: number;
};

export default function PercentageRing({ ringSize, fontSize, score }: Props) {
  const radius = ringSize / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={styles.wrapper} style={{ width: ringSize, height: ringSize }}>
      <svg>
        <defs>
          <linearGradient id="gradient" transform="rotate(180)">
            <stop offset="0%" stop-color="var(--j-color-primary-400)" />
            <stop offset="100%" stop-color="var(--j-color-primary-600)" />
          </linearGradient>
        </defs>
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={ringSize / 10}
          strokeDasharray={`${(circumference * score) / 100} ${circumference}`}
        />
      </svg>
      <p style={{ fontSize }}>{score.toFixed(1)}%</p>
    </div>
  );
}
