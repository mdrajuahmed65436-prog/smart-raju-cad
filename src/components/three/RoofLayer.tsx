import { useMemo } from 'react';
import { DoubleSide, ExtrudeGeometry, Shape } from 'three';
import { WALL_HEIGHT, type FloorPlan } from '@/lib/floorPlan';
import { PANEL, ROOF_PITCH_DEG, type SolarFace, type SolarResult } from '@/lib/solar';
import type { RoofType, RoofView } from '@/types/plan';

const PITCH = (ROOF_PITCH_DEG * Math.PI) / 180;
const PANEL_COLOR = '#1e3a8a';

interface RoofLayerProps {
  plan: FloorPlan;
  roofType: RoofType;
  view: RoofView;
  solar: SolarResult;
}

function SolarFaceMesh({ face, transparent, depth }: { face: SolarFace; transparent: boolean; depth: number }) {
  const material = (
    <meshStandardMaterial color={PANEL_COLOR} metalness={0.45} roughness={0.25} transparent={transparent} opacity={transparent ? 0.85 : 1} />
  );
  const panels = face.panels.map((p, i) => (
    <mesh key={i} position={[p.u + PANEL.length / 2, face.kind === 'flat' ? 0.15 : face.side === 'A' ? 0.2 : -0.2, p.v + PANEL.width / 2]}>
      <boxGeometry args={[PANEL.length, 0.25, PANEL.width]} />
      {material}
    </mesh>
  ));

  if (face.kind === 'flat') {
    return <group position={[0, WALL_HEIGHT + 0.8, 0]}>{panels}</group>;
  }
  if (face.side === 'A') {
    return <group position={[0, WALL_HEIGHT, 0]} rotation={[-PITCH, 0, 0]}>{panels}</group>;
  }
  return <group position={[0, WALL_HEIGHT, depth]} rotation={[Math.PI + PITCH, 0, 0]}>{panels}</group>;
}

export default function RoofLayer({ plan, roofType, view, solar }: RoofLayerProps) {
  const X = plan.length;
  const D = plan.width;
  const ridgeHeight = (D / 2) * Math.tan(PITCH);

  const slopedGeometry = useMemo(() => {
    if (roofType !== 'Sloped') return null;
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-D / 2, ridgeHeight);
    shape.lineTo(-D, 0);
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, { depth: X, bevelEnabled: false });
    geometry.rotateY(Math.PI / 2);
    return geometry;
  }, [roofType, X, D, ridgeHeight]);

  if (view === 'hidden') return null;

  const transparent = view === 'transparent';
  const roofMaterial = (
    <meshStandardMaterial
      color={roofType === 'Flat' ? '#64748b' : '#9a4d32'}
      roughness={0.85}
      side={DoubleSide}
      transparent={transparent}
      opacity={transparent ? 0.2 : 1}
      depthWrite={!transparent}
    />
  );

  return (
    <group>
      {roofType === 'Flat' ? (
        <mesh position={[X / 2, WALL_HEIGHT + 0.4, D / 2]}>
          <boxGeometry args={[X + 1, 0.8, D + 1]} />
          {roofMaterial}
        </mesh>
      ) : (
        slopedGeometry && (
          <mesh geometry={slopedGeometry} position={[0, WALL_HEIGHT, 0]}>
            {roofMaterial}
          </mesh>
        )
      )}
      {solar.faces.map((face, i) => (
        <SolarFaceMesh key={i} face={face} transparent={transparent} depth={D} />
      ))}
    </group>
  );
}
