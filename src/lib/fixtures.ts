import type { FloorPlan, Point, Rect, RoomKind } from '@/lib/floorPlan';

export interface FanSpot extends Point {
  id: string;
  roomName: string;
}

export interface LightSpot extends Point {
  id: string;
  roomName: string;
}

export interface Fixtures {
  fans: FanSpot[];
  lights: LightSpot[];
}

const FAN_ROOMS: RoomKind[] = ['living', 'bedroom', 'dining', 'kitchen'];
const LIGHT_SPACING_SQFT = 110;

function centerOf(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function lightPositions(rect: Rect, count: number): Point[] {
  if (count === 1) return [{ x: rect.x + rect.w / 2, y: rect.y + rect.h * 0.3 }];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const positions: Point[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    positions.push({
      x: rect.x + (rect.w * (c + 0.5)) / cols,
      y: rect.y + (rect.h * (r + 0.5)) / rows,
    });
  }
  return positions;
}

export function lightCountFor(area: number): number {
  return Math.max(1, Math.round(area / LIGHT_SPACING_SQFT));
}

export function computeFixtures(plan: FloorPlan): Fixtures {
  const fans: FanSpot[] = [];
  const lights: LightSpot[] = [];
  for (const room of plan.rooms) {
    if (FAN_ROOMS.includes(room.kind)) {
      fans.push({ ...centerOf(room.rect), id: `fan-${room.id}`, roomName: room.name });
    }
    const count = lightCountFor(room.area);
    lightPositions(room.rect, count).forEach((p, i) => {
      lights.push({ ...p, id: `light-${room.id}-${i}`, roomName: room.name });
    });
  }
  return { fans, lights };
}
