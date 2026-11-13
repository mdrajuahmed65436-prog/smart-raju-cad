import { WALL_HEIGHT, type FloorPlan, type Segment } from '@/lib/floorPlan';
import type { Fixtures } from '@/lib/fixtures';
import { PANEL, ROOF_PITCH_DEG, type SolarResult } from '@/lib/solar';
import type { PlanConfig } from '@/types/plan';

export interface BomRow {
  section: string;
  item: string;
  quantity: number;
  unit: string;
  note: string;
}

const BRICKS_PER_SQFT = 13.5;
const FLOOR_WASTAGE = 1.1;

function segmentLength(s: Segment): number {
  return Math.abs(s.b.x - s.a.x) + Math.abs(s.b.y - s.a.y);
}

export function buildBillOfMaterials(
  plan: FloorPlan,
  config: PlanConfig,
  solar: SolarResult,
  fixtures: Fixtures
): BomRow[] {
  const wallLength = plan.walls.reduce((sum, s) => sum + segmentLength(s), 0);
  const wallArea = wallLength * WALL_HEIGHT;
  const floorArea = plan.rooms.reduce((sum, r) => sum + r.area, 0);
  const railingLength = plan.balconies.reduce((sum, b) => sum + 2 * (b.rect.w + b.rect.h) - Math.max(b.rect.w, b.rect.h), 0);
  const doors = plan.openings.filter((o) => o.kind === 'door').length;
  const windows = plan.openings.filter((o) => o.kind === 'window').length;
  const slidingDoors = plan.openings.filter((o) => o.kind === 'sliding').length;
  const roofLabel = config.roofType === 'Flat' ? 'Flat concrete roof slab' : 'Sloped roof (two faces)';
  const stairSteps = plan.stair.steps.length;

  return [
    { section: 'Structure', item: 'Wall length (centre line)', quantity: Math.round(wallLength), unit: 'ft', note: 'Measured from the floor plan' },
    { section: 'Structure', item: 'Wall area', quantity: Math.round(wallArea), unit: 'sq ft', note: `Wall height ${WALL_HEIGHT} ft` },
    { section: 'Structure', item: 'Bricks (approx.)', quantity: Math.ceil(wallArea * BRICKS_PER_SQFT), unit: 'pcs', note: 'Standard bricks, 9 inch walls, before wastage' },
    { section: 'Finishes', item: 'Floor tiles (incl. 10% wastage)', quantity: Math.ceil(floorArea * FLOOR_WASTAGE), unit: 'sq ft', note: 'Total area of all rooms' },
    { section: 'Roof', item: roofLabel, quantity: Math.round(solar.roofArea), unit: 'sq ft', note: config.roofType === 'Flat' ? 'Level roof' : `${ROOF_PITCH_DEG} degree pitch` },
    { section: 'Openings', item: `Doors (${config.doorStyle})`, quantity: doors, unit: 'pcs', note: 'Room entrances' },
    { section: 'Openings', item: `Windows (${config.windowStyle})`, quantity: windows, unit: 'pcs', note: 'Exterior walls' },
    { section: 'Openings', item: 'Balcony sliding doors', quantity: slidingDoors, unit: 'pcs', note: 'Connect rooms to balconies' },
    { section: 'Staircase', item: `${config.staircaseType} staircase steps`, quantity: stairSteps, unit: 'pcs', note: `Position: ${config.staircasePosition}` },
    { section: 'Balcony', item: 'Balcony railing', quantity: Math.round(railingLength), unit: 'ft', note: 'Open sides only' },
    { section: 'Electrical', item: 'Ceiling fans', quantity: fixtures.fans.length, unit: 'pcs', note: 'Living, bedrooms, dining and kitchen' },
    { section: 'Electrical', item: 'LED ceiling lights', quantity: fixtures.lights.length, unit: 'pcs', note: 'About one per 110 sq ft' },
    { section: 'Solar', item: `Solar panels (${PANEL.length} x ${PANEL.width} ft, ${PANEL.watts} W)`, quantity: solar.panelCount, unit: 'pcs', note: `${solar.kWp.toFixed(2)} kWp total` },
  ];
}
