interface Perlin {
  perlin2(x: number, y: number): number;
  perlin3(x: number, y: number, z: number): number;
  seed(seed: number): void;
}

declare const perlin: Perlin;
export default perlin;
