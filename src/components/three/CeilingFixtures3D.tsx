import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { WALL_HEIGHT } from '@/lib/floorPlan';
import type { Fixtures } from '@/lib/fixtures';

const FAN_BLADE_COUNT = 4;

function CeilingFan({ x, z }: { x: number; z: number }) {
  const blades = useRef<Group>(null);
  useFrame((_, delta) => {
    if (blades.current) blades.current.rotation.y += delta * 4;
  });
  return (
    <group position={[x, WALL_HEIGHT - 0.8, z]}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
      </mesh>
      <group ref={blades}>
        {Array.from({ length: FAN_BLADE_COUNT }, (_, i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / FAN_BLADE_COUNT, 0]}>
            <mesh position={[1.6, -0.1, 0]}>
              <boxGeometry args={[3.2, 0.05, 0.6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function CeilingFixtures3D({ fixtures }: { fixtures: Fixtures }) {
  return (
    <group>
      {fixtures.fans.map((fan) => (
        <CeilingFan key={fan.id} x={fan.x} z={fan.y} />
      ))}
      {fixtures.lights.map((light) => (
        <mesh key={light.id} position={[light.x, WALL_HEIGHT - 0.1, light.y]}>
          <cylinderGeometry args={[0.6, 0.6, 0.15, 20]} />
          <meshStandardMaterial color="#fff7e6" emissive="#fde68a" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  );
}
