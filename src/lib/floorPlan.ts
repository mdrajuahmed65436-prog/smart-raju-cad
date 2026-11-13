import type { BalconySide, NamedRoom, PlanConfig, StaircaseType } from '@/types/plan';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Segment {
  a: Point;
  b: Point;
}

export type RoomKind = 'living' | 'bedroom' | 'bathroom' | 'kitchen' | 'dining' | 'staircase';

export interface Room {
  id: string;
  kind: RoomKind;
  name: string;
  rect: Rect;
  area: number;
}

export interface Balcony {
  id: string;
  side: BalconySide;
  rect: Rect;
}

export interface StairStep {
  rect: Rect;
  top: number;
}

export interface Stair {
  type: StaircaseType;
  exterior: boolean;
  rect: Rect;
  steps: StairStep[];
}

export type OpeningKind = 'door' | 'window' | 'sliding';

export interface Opening {
  kind: OpeningKind;
  a: Point;
  b: Point;
  into: Point;
}

export interface FloorPlan {
  length: number;
  width: number;
  footprint: Rect;
  rooms: Room[];
  balconies: Balcony[];
  stair: Stair;
  openings: Opening[];
  walls: Segment[];
  bounds: Rect;
  footprintArea: number;
  roomScale: number;
}

export const WALL_HEIGHT = 10;
export const WALL_THICKNESS = 0.5;
export const BALCONY_DEPTH = 6;
export const RISER = WALL_HEIGHT / 17;
export const TREAD = 0.9;

const FLIGHT_WIDTH = 4.5;
const EPS = 0.01;

const STAIR_ZONE_WIDTH: Record<StaircaseType, number> = {
  Straight: FLIGHT_WIDTH,
  'U-Shape': FLIGHT_WIDTH * 2,
  'L-Shape': FLIGHT_WIDTH + 6 * TREAD,
};

const AREA_WEIGHT = { living: 220, dining: 130, kitchen: 120, bedroom: 150, bathroom: 50 } as const;

interface RoomSpec {
  id: string;
  kind: RoomKind;
  name: string;
  weight: number;
}

interface Edge {
  side: 'top' | 'bottom' | 'left' | 'right';
  a: Point;
  b: Point;
  into: Point;
  outer: boolean;
}

function labelOrDefault(room: NamedRoom, fallback: string): string {
  const trimmed = room.name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function buildRoomSpecs(config: PlanConfig): RoomSpec[] {
  const specs: RoomSpec[] = [{ id: 'living', kind: 'living', name: 'Living Room', weight: AREA_WEIGHT.living }];
  config.diningRooms.forEach((room, i) =>
    specs.push({
      id: `dining-${room.id}`,
      kind: 'dining',
      name: labelOrDefault(room, `Dining ${i + 1}`),
      weight: AREA_WEIGHT.dining,
    })
  );
  for (let i = 0; i < config.kitchens; i++) {
    specs.push({
      id: `kitchen-${i}`,
      kind: 'kitchen',
      name: config.kitchens === 1 ? 'Kitchen' : `Kitchen ${i + 1}`,
      weight: AREA_WEIGHT.kitchen,
    });
  }
  config.bedrooms.forEach((room, i) =>
    specs.push({
      id: `bedroom-${room.id}`,
      kind: 'bedroom',
      name: labelOrDefault(room, `Bedroom ${i + 1}`),
      weight: AREA_WEIGHT.bedroom,
    })
  );
  for (let i = 0; i < config.bathrooms; i++) {
    specs.push({ id: `bathroom-${i}`, kind: 'bathroom', name: `Bathroom ${i + 1}`, weight: AREA_WEIGHT.bathroom });
  }
  return specs;
}

function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

function splitBalanced<T extends { weight: number }>(items: T[], total: number): [T[], T[]] {
  let acc = 0;
  let split = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < items.length; i++) {
    acc += items[i - 1].weight;
    const diff = Math.abs(acc / total - 0.5);
    if (diff < bestDiff) {
      bestDiff = diff;
      split = i;
    }
  }
  return [items.slice(0, split), items.slice(split)];
}

function partitionRooms(rect: Rect, specs: RoomSpec[]): Room[] {
  if (specs.length === 0) return [];
  if (specs.length === 1) {
    const spec = specs[0];
    return [{ id: spec.id, kind: spec.kind, name: spec.name, rect, area: rect.w * rect.h }];
  }
  const total = sumBy(specs, (s) => s.weight);
  const [left, right] = splitBalanced(specs, total);
  const ratio = sumBy(left, (s) => s.weight) / total;
  if (rect.w >= rect.h) {
    const lw = rect.w * ratio;
    return [
      ...partitionRooms({ x: rect.x, y: rect.y, w: lw, h: rect.h }, left),
      ...partitionRooms({ x: rect.x + lw, y: rect.y, w: rect.w - lw, h: rect.h }, right),
    ];
  }
  const lh = rect.h * ratio;
  return [
    ...partitionRooms({ x: rect.x, y: rect.y, w: rect.w, h: lh }, left),
    ...partitionRooms({ x: rect.x, y: rect.y + lh, w: rect.w, h: rect.h - lh }, right),
  ];
}

function assignToRegions(specs: RoomSpec[], regions: Rect[]): RoomSpec[][] {
  const groups: RoomSpec[][] = regions.map(() => []);
  const loads = regions.map(() => 0);
  for (const spec of specs) {
    let target = 0;
    for (let r = 1; r < regions.length; r++) {
      if (loads[r] / (regions[r].w * regions[r].h) < loads[target] / (regions[target].w * regions[target].h)) {
        target = r;
      }
    }
    groups[target].push(spec);
    loads[target] += spec.weight;
  }
  return groups;
}

function layoutStairs(type: StaircaseType, zone: Rect): { steps: StairStep[] } {
  const { x, h: D } = zone;
  const steps: StairStep[] = [];
  if (type === 'Straight') {
    for (let i = 0; i < 17; i++) {
      steps.push({ rect: { x, y: D - (i + 1) * TREAD, w: FLIGHT_WIDTH, h: TREAD }, top: (i + 1) * RISER });
    }
  } else if (type === 'U-Shape') {
    for (let i = 0; i < 9; i++) {
      steps.push({ rect: { x, y: D - (i + 1) * TREAD, w: FLIGHT_WIDTH, h: TREAD }, top: (i + 1) * RISER });
    }
    for (let j = 0; j < 8; j++) {
      steps.push({
        rect: { x: x + FLIGHT_WIDTH, y: D - 9 * TREAD + j * TREAD, w: FLIGHT_WIDTH, h: TREAD },
        top: (8 - j) * RISER,
      });
    }
  } else {
    for (let i = 0; i < 11; i++) {
      steps.push({ rect: { x, y: D - (i + 1) * TREAD, w: FLIGHT_WIDTH, h: TREAD }, top: (i + 1) * RISER });
    }
    const landingY = D - 11 * TREAD - FLIGHT_WIDTH;
    steps.push({ rect: { x, y: landingY, w: FLIGHT_WIDTH, h: FLIGHT_WIDTH }, top: 11 * RISER });
    for (let k = 0; k < 6; k++) {
      steps.push({
        rect: { x: x + FLIGHT_WIDTH + k * TREAD, y: landingY, w: TREAD, h: FLIGHT_WIDTH },
        top: (12 + k) * RISER,
      });
    }
  }
  return { steps };
}

function edgesOf(rect: Rect, footprint: Rect): Edge[] {
  const { x, y, w, h } = rect;
  const onOuter = (line: number, boundary: number) => Math.abs(line - boundary) < EPS;
  const fx2 = footprint.x + footprint.w;
  const fy2 = footprint.y + footprint.h;
  return [
    { side: 'top', a: { x, y }, b: { x: x + w, y }, into: { x: 0, y: 1 }, outer: onOuter(y, footprint.y) },
    { side: 'bottom', a: { x, y: y + h }, b: { x: x + w, y: y + h }, into: { x: 0, y: -1 }, outer: onOuter(y + h, fy2) },
    { side: 'left', a: { x, y }, b: { x, y: y + h }, into: { x: 1, y: 0 }, outer: onOuter(x, footprint.x) },
    { side: 'right', a: { x: x + w, y }, b: { x: x + w, y: y + h }, into: { x: -1, y: 0 }, outer: onOuter(x + w, fx2) },
  ];
}

function edgeLength(e: Edge): number {
  return Math.abs(e.b.x - e.a.x) + Math.abs(e.b.y - e.a.y);
}

function edgeMidpoint(e: Edge): Point {
  return { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
}

function openingAlong(e: Edge, width: number, kind: OpeningKind): Opening {
  const mid = edgeMidpoint(e);
  const horizontal = e.a.y === e.b.y;
  const half = width / 2;
  const dx = horizontal ? half : 0;
  const dy = horizontal ? 0 : half;
  return {
    kind,
    a: { x: mid.x - dx, y: mid.y - dy },
    b: { x: mid.x + dx, y: mid.y + dy },
    into: e.into,
  };
}

function segmentKey(s: Segment): string {
  const p1 = `${s.a.x.toFixed(2)},${s.a.y.toFixed(2)}`;
  const p2 = `${s.b.x.toFixed(2)},${s.b.y.toFixed(2)}`;
  return p1 < p2 ? `${p1}|${p2}` : `${p2}|${p1}`;
}

function subtractSpan(span: [number, number], cut: [number, number]): [number, number][] {
  const [s, e] = span;
  const [cs, ce] = cut;
  if (ce <= s || cs >= e) return [span];
  const result: [number, number][] = [];
  if (cs > s) result.push([s, cs]);
  if (ce < e) result.push([ce, e]);
  return result;
}

function cutSegment(seg: Segment, openings: Opening[]): Segment[] {
  const horizontal = seg.a.y === seg.b.y;
  const line = horizontal ? seg.a.y : seg.a.x;
  const start = horizontal ? Math.min(seg.a.x, seg.b.x) : Math.min(seg.a.y, seg.b.y);
  const end = horizontal ? Math.max(seg.a.x, seg.b.x) : Math.max(seg.a.y, seg.b.y);
  let spans: [number, number][] = [[start, end]];
  for (const o of openings) {
    const oHorizontal = o.a.y === o.b.y;
    if (oHorizontal !== horizontal) continue;
    const oLine = oHorizontal ? o.a.y : o.a.x;
    if (Math.abs(oLine - line) > EPS) continue;
    const oStart = oHorizontal ? Math.min(o.a.x, o.b.x) : Math.min(o.a.y, o.b.y);
    const oEnd = oHorizontal ? Math.max(o.a.x, o.b.x) : Math.max(o.a.y, o.b.y);
    spans = spans.flatMap((span) => subtractSpan(span, [oStart, oEnd]));
  }
  return spans
    .filter(([s, e]) => e - s > EPS)
    .map(([s, e]) =>
      horizontal
        ? { a: { x: s, y: line }, b: { x: e, y: line } }
        : { a: { x: line, y: s }, b: { x: line, y: e } }
    );
}

function buildOpenings(rooms: Room[], footprint: Rect, config: PlanConfig, exterior: boolean): Opening[] {
  const center = { x: footprint.x + footprint.w / 2, y: footprint.y + footprint.h / 2 };
  const openings: Opening[] = [];
  const balconyTouches = (side: BalconySide) => config.balconies.includes(side) && !(side === 'Right' && exterior);
  const sideToBalcony: Record<Edge['side'], BalconySide> = { top: 'Front', bottom: 'Back', left: 'Left', right: 'Right' };

  for (const room of rooms) {
    const edges = edgesOf(room.rect, footprint);
    const doorWidth = room.kind === 'bathroom' ? 2.5 : 3;
    const doorCandidates = edges.filter((e) => edgeLength(e) >= doorWidth + 1);
    let doorEdge: Edge | null = null;
    let bestScore = Infinity;
    for (const e of doorCandidates) {
      const m = edgeMidpoint(e);
      const score = Math.hypot(m.x - center.x, m.y - center.y) + (e.outer ? 1000 : 0);
      if (score < bestScore) {
        bestScore = score;
        doorEdge = e;
      }
    }
    if (doorEdge) openings.push(openingAlong(doorEdge, doorWidth, 'door'));

    if (room.kind === 'staircase') continue;
    for (const e of edges) {
      if (!e.outer || e === doorEdge || edgeLength(e) < 3) continue;
      const len = edgeLength(e);
      if (balconyTouches(sideToBalcony[e.side])) {
        openings.push(openingAlong(e, Math.min(6, len * 0.6), 'sliding'));
      } else {
        openings.push(openingAlong(e, Math.min(4, len * 0.5), 'window'));
      }
    }
  }
  return openings;
}

export function computeFloorPlan(config: PlanConfig): FloorPlan {
  const X = config.lengthFt;
  const D = config.widthFt;
  const footprint: Rect = { x: 0, y: 0, w: X, h: D };
  const exterior = config.staircasePosition === 'Exterior';
  const zoneW = STAIR_ZONE_WIDTH[config.staircaseType];
  const zoneX =
    config.staircasePosition === 'Left'
      ? 0
      : config.staircasePosition === 'Right'
        ? X - zoneW
        : config.staircasePosition === 'Center'
          ? (X - zoneW) / 2
          : X;
  const zone: Rect = { x: zoneX, y: 0, w: zoneW, h: D };
  const { steps } = layoutStairs(config.staircaseType, zone);
  const stair: Stair = { type: config.staircaseType, exterior, rect: zone, steps };

  const specs = buildRoomSpecs(config);
  let regions: Rect[];
  if (exterior) {
    regions = [footprint];
  } else if (config.staircasePosition === 'Center') {
    regions = [
      { x: 0, y: 0, w: zoneX, h: D },
      { x: zoneX + zoneW, y: 0, w: X - zoneX - zoneW, h: D },
    ];
  } else if (config.staircasePosition === 'Left') {
    regions = [{ x: zoneW, y: 0, w: X - zoneW, h: D }];
  } else {
    regions = [{ x: 0, y: 0, w: X - zoneW, h: D }];
  }

  const groups = assignToRegions(specs, regions);
  const rooms: Room[] = [];
  let scaleSum = 0;
  let scaleCount = 0;
  groups.forEach((group, i) => {
    const region = regions[i];
    const regionArea = region.w * region.h;
    const weightSum = sumBy(group, (s) => s.weight);
    if (weightSum === 0) return;
    const factor = regionArea / weightSum;
    scaleSum += factor;
    scaleCount++;
    const scaled = group.map((s) => ({ ...s, weight: s.weight * factor }));
    rooms.push(...partitionRooms(region, scaled));
  });

  if (!exterior) {
    rooms.push({
      id: 'staircase',
      kind: 'staircase',
      name: 'Staircase',
      rect: zone,
      area: zone.w * zone.h,
    });
  }

  const balconies: Balcony[] = config.balconies.map((side) => {
    const rightOffset = exterior ? zoneW : 0;
    const rects: Record<BalconySide, Rect> = {
      Front: { x: 0, y: -BALCONY_DEPTH, w: X, h: BALCONY_DEPTH },
      Back: { x: 0, y: D, w: X, h: BALCONY_DEPTH },
      Left: { x: -BALCONY_DEPTH, y: 0, w: BALCONY_DEPTH, h: D },
      Right: { x: X + rightOffset, y: 0, w: BALCONY_DEPTH, h: D },
    };
    return { id: `balcony-${side}`, side, rect: rects[side] };
  });

  const openings = buildOpenings(rooms, footprint, config, exterior);
  const seen = new Set<string>();
  const walls: Segment[] = [];
  for (const room of rooms) {
    for (const e of edgesOf(room.rect, footprint)) {
      const seg: Segment = { a: e.a, b: e.b };
      const key = segmentKey(seg);
      if (seen.has(key)) continue;
      seen.add(key);
      walls.push(...cutSegment(seg, openings));
    }
  }

  const boundsParts: Rect[] = [footprint, ...balconies.map((b) => b.rect)];
  if (exterior) boundsParts.push(zone);
  const minX = Math.min(...boundsParts.map((r) => r.x));
  const minY = Math.min(...boundsParts.map((r) => r.y));
  const maxX = Math.max(...boundsParts.map((r) => r.x + r.w));
  const maxY = Math.max(...boundsParts.map((r) => r.y + r.h));

  return {
    length: X,
    width: D,
    footprint,
    rooms,
    balconies,
    stair,
    openings,
    walls,
    bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    footprintArea: X * D,
    roomScale: scaleCount > 0 ? scaleSum / scaleCount : 1,
  };
}
