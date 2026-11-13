import type { RefObject } from 'react';
import { Grid, OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import type { FloorPlan } from '@/lib/floorPlan';
import type { Fixtures } from '@/lib/fixtures';
import type { SolarResult } from '@/lib/solar';
import type { DoorStyle, RoofType, RoofView, WindowStyle } from '@/types/plan';
import Structure from '@/components/three/Structure';
import RoofLayer from '@/components/three/RoofLayer';
import CeilingFixtures3D from '@/components/three/CeilingFixtures3D';

interface ModelSceneProps {
  plan: FloorPlan;
  roofType: RoofType;
  roofView: RoofView;
  doorStyle: DoorStyle;
  windowStyle: WindowStyle;
  solar: SolarResult;
  fixtures: Fixtures;
  buildingRef: RefObject<Group>;
}

export default function ModelScene({ plan, roofType, roofView, doorStyle, windowStyle, solar, fixtures, buildingRef }: ModelSceneProps) {
  const span = Math.max(plan.length, plan.width);
  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#ffffff', '#334155', 0.5]} />
      <directionalLight position={[span, span * 1.5, span]} intensity={1.1} />
      <Grid
        args={[span * 4, span * 4]}
        position={[0, -0.45, 0]}
        cellSize={2}
        sectionSize={10}
        cellColor="#94a3b8"
        sectionColor="#64748b"
        fadeDistance={span * 4}
        fadeStrength={1.5}
      />
      <group ref={buildingRef} position={[-plan.length / 2, 0, -plan.width / 2]}>
        <Structure plan={plan} doorStyle={doorStyle} windowStyle={windowStyle} />
        <RoofLayer plan={plan} roofType={roofType} view={roofView} solar={solar} />
        <CeilingFixtures3D fixtures={fixtures} />
      </group>
      <OrbitControls
        makeDefault
        target={[0, 4, 0]}
        minDistance={10}
        maxDistance={span * 4}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}
