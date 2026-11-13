import type { Point } from '@/lib/floorPlan';

interface BarProps {
  from: Point;
  to: Point;
  bottom: number;
  top: number;
  thickness: number;
  color: string;
  opacity?: number;
}

export default function Bar({ from, to, bottom, top, thickness, color, opacity = 1 }: BarProps) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const horizontal = Math.abs(to.y - from.y) < 1e-6;
  const height = top - bottom;
  const transparent = opacity < 1;
  return (
    <mesh position={[(from.x + to.x) / 2, bottom + height / 2, (from.y + to.y) / 2]}>
      <boxGeometry args={horizontal ? [length, height, thickness] : [thickness, height, length]} />
      <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} roughness={0.75} depthWrite={!transparent} />
    </mesh>
  );
}
