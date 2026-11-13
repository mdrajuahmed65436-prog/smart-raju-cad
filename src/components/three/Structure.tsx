import { WALL_HEIGHT, WALL_THICKNESS, type FloorPlan, type Opening, type Room } from '@/lib/floorPlan';
import type { DoorStyle, WindowStyle } from '@/types/plan';
import Bar from '@/components/three/Bar';

const WALL_COLOR = '#f1f5f9';
const FLOOR_COLORS: Record<Room['kind'], string> = {
  living: '#d6c4a5',
  bedroom: '#c9b79c',
  bathroom: '#bae6fd',
  kitchen: '#e7e5e4',
  dining: '#d4b896',
  staircase: '#a8a29e',
};
const DOOR_COLORS: Record<DoorStyle, { color: string; opacity: number }> = {
  'Wooden Panel': { color: '#8b5a2b', opacity: 1 },
  'Glass Sliding': { color: '#93c5fd', opacity: 0.4 },
  'Modern Flush': { color: '#e5e7eb', opacity: 1 },
};
const WINDOW_COLORS: Record<WindowStyle, { glass: string; frame: string }> = {
  'Glass Casement': { glass: '#7dd3fc', frame: '#e2e8f0' },
  'Wooden Frame': { glass: '#bae6fd', frame: '#8b5a2b' },
  'Sliding Glass': { glass: '#a5f3fc', frame: '#94a3b8' },
};
const RAIL_COLOR = '#334155';
const STEP_COLOR = '#d6d3d1';
const DOOR_HEIGHT = 7;
const WINDOW_SILL = 3;
const WINDOW_HEAD = 7;

interface StructureProps {
  plan: FloorPlan;
  doorStyle: DoorStyle;
  windowStyle: WindowStyle;
}

function OpeningFrame({ opening, windowColor }: { opening: Opening; windowColor: { glass: string; frame: string } }) {
  if (opening.kind === 'door') {
    return <Bar from={opening.a} to={opening.b} bottom={DOOR_HEIGHT} top={WALL_HEIGHT} thickness={WALL_THICKNESS} color={WALL_COLOR} />;
  }
  if (opening.kind === 'sliding') {
    return (
      <>
        <Bar from={opening.a} to={opening.b} bottom={DOOR_HEIGHT + 0.5} top={WALL_HEIGHT} thickness={WALL_THICKNESS} color={WALL_COLOR} />
        <Bar from={opening.a} to={opening.b} bottom={0} top={DOOR_HEIGHT + 0.5} thickness={0.12} color={windowColor.glass} opacity={0.35} />
      </>
    );
  }
  return (
    <>
      <Bar from={opening.a} to={opening.b} bottom={0} top={WINDOW_SILL} thickness={WALL_THICKNESS} color={WALL_COLOR} />
      <Bar from={opening.a} to={opening.b} bottom={WINDOW_HEAD} top={WALL_HEIGHT} thickness={WALL_THICKNESS} color={WALL_COLOR} />
      <Bar from={opening.a} to={opening.b} bottom={WINDOW_SILL} top={WINDOW_HEAD} thickness={0.12} color={windowColor.glass} opacity={0.45} />
      <Bar from={opening.a} to={opening.b} bottom={WINDOW_SILL} top={WINDOW_SILL + 0.3} thickness={0.5} color={windowColor.frame} />
    </>
  );
}

export default function Structure({ plan, doorStyle, windowStyle }: StructureProps) {
  const door = DOOR_COLORS[doorStyle];
  const windowColor = WINDOW_COLORS[windowStyle];
  const floorRects = [
    ...plan.rooms.map((room) => ({ key: room.id, rect: room.rect, color: FLOOR_COLORS[room.kind] })),
    ...plan.balconies.map((b) => ({ key: b.id, rect: b.rect, color: '#cbd5e1' })),
  ];

  return (
    <group>
      {floorRects.map(({ key, rect, color }) => (
        <mesh key={`floor-${key}`} position={[rect.x + rect.w / 2, -0.2, rect.y + rect.h / 2]}>
          <boxGeometry args={[rect.w, 0.4, rect.h]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}

      {plan.walls.map((wall, i) => (
        <Bar key={`wall-${i}`} from={wall.a} to={wall.b} bottom={0} top={WALL_HEIGHT} thickness={WALL_THICKNESS} color={WALL_COLOR} />
      ))}

      {plan.openings.map((opening, i) => (
        <group key={`opening-${i}`}>
          <OpeningFrame opening={opening} windowColor={windowColor} />
          {opening.kind === 'door' && (
            <Bar from={opening.a} to={opening.b} bottom={0} top={DOOR_HEIGHT} thickness={0.2} color={door.color} opacity={door.opacity} />
          )}
        </group>
      ))}

      {plan.balconies.map((balcony) => {
        const r = balcony.rect;
        const corners = {
          tl: { x: r.x, y: r.y },
          tr: { x: r.x + r.w, y: r.y },
          bl: { x: r.x, y: r.y + r.h },
          br: { x: r.x + r.w, y: r.y + r.h },
        };
        const edges = [
          { id: 'top', from: corners.tl, to: corners.tr, side: 'Back' },
          { id: 'bottom', from: corners.bl, to: corners.br, side: 'Front' },
          { id: 'left', from: corners.tl, to: corners.bl, side: 'Right' },
          { id: 'right', from: corners.tr, to: corners.br, side: 'Left' },
        ];
        return (
          <group key={balcony.id}>
            {edges
              .filter((e) => e.side !== balcony.side)
              .map((e) => (
                <Bar key={e.id} from={e.from} to={e.to} bottom={2.5} top={3.4} thickness={0.2} color={RAIL_COLOR} />
              ))}
          </group>
        );
      })}

      {plan.stair.steps.map((step, i) => (
        <mesh key={`step-${i}`} position={[step.rect.x + step.rect.w / 2, step.top / 2, step.rect.y + step.rect.h / 2]}>
          <boxGeometry args={[step.rect.w, step.top, step.rect.h]} />
          <meshStandardMaterial color={STEP_COLOR} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
