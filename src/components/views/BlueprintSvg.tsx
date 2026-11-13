import type { RefObject } from 'react';
import { BALCONY_DEPTH, WALL_THICKNESS, type FloorPlan, type Opening, type Point, type Room } from '@/lib/floorPlan';

const PALETTE = {
  paper: '#12395c',
  grid: '#1d4f7a',
  wall: '#eaf3fc',
  dim: '#9fd0f5',
  text: '#f4f9ff',
  muted: '#b7d8f3',
  glass: '#7fd1ff',
  door: '#f4d28a',
};

const ROOM_TINT: Record<Room['kind'], string> = {
  living: '#60a5fa',
  bedroom: '#34d399',
  bathroom: '#22d3ee',
  kitchen: '#fb923c',
  dining: '#f472b6',
  staircase: '#a8a29e',
};

const PAD = 8;
const TITLE_HEIGHT = 5;

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

function DoorSymbol({ opening }: { opening: Opening }) {
  const { a, b, into } = opening;
  const w = Math.hypot(b.x - a.x, b.y - a.y);
  const leaf: Point = { x: a.x + into.x * w, y: a.y + into.y * w };
  const cross = (leaf.x - a.x) * (b.y - a.y) - (leaf.y - a.y) * (b.x - a.x);
  const sweep = cross > 0 ? 1 : 0;
  return (
    <g fill="none" stroke={PALETTE.door} strokeWidth={0.2}>
      <line x1={a.x} y1={a.y} x2={leaf.x} y2={leaf.y} />
      <path d={`M ${leaf.x} ${leaf.y} A ${w} ${w} 0 0 ${sweep} ${b.x} ${b.y}`} strokeDasharray="0.6 0.4" />
    </g>
  );
}

function WindowSymbol({ opening }: { opening: Opening }) {
  const { a, b, into, kind } = opening;
  const t = 0.3;
  const points = [
    `${a.x + into.x * t},${a.y + into.y * t}`,
    `${b.x + into.x * t},${b.y + into.y * t}`,
    `${b.x - into.x * t},${b.y - into.y * t}`,
    `${a.x - into.x * t},${a.y - into.y * t}`,
  ].join(' ');
  return (
    <g>
      <polygon points={points} fill={PALETTE.glass} fillOpacity={0.45} stroke={PALETTE.glass} strokeWidth={0.15} />
      {kind === 'sliding' && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={PALETTE.glass} strokeWidth={0.12} />}
    </g>
  );
}

function RoomLabel({ room }: { room: Room }) {
  const { rect } = room;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const size = Math.max(0.9, Math.min(1.7, Math.min(rect.w, rect.h) / 7));
  const lineGap = size * 1.25;
  return (
    <text x={cx} y={cy - lineGap} textAnchor="middle" fill={PALETTE.text} fontSize={size} fontFamily="Inter, Arial, sans-serif">
      <tspan x={cx} fontWeight={700}>
        {room.name}
      </tspan>
      <tspan x={cx} dy={lineGap} fill={PALETTE.muted} fontSize={size * 0.8}>
        {`${fmt(rect.w)} x ${fmt(rect.h)} ft`}
      </tspan>
      <tspan x={cx} dy={lineGap * 0.9} fill={PALETTE.dim} fontSize={size * 0.8}>
        {`${Math.round(room.area)} sq ft`}
      </tspan>
    </text>
  );
}

interface BlueprintSvgProps {
  plan: FloorPlan;
  svgRef?: RefObject<SVGSVGElement>;
}

export default function BlueprintSvg({ plan, svgRef }: BlueprintSvgProps) {
  const { bounds, footprint } = plan;
  const viewX = bounds.x - PAD;
  const viewY = bounds.y - PAD - TITLE_HEIGHT;
  const viewW = bounds.w + PAD * 2;
  const viewH = bounds.h + PAD * 2 + TITLE_HEIGHT;
  const dimY = bounds.y + bounds.h + 4;
  const dimX = bounds.x + bounds.w + 4;
  const totalRoomArea = plan.rooms.reduce((sum, r) => sum + r.area, 0);

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Ground floor blueprint, ${plan.length} by ${plan.width} feet`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="blueprint-grid" width={5} height={5} patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke={PALETTE.grid} strokeWidth={0.08} />
        </pattern>
      </defs>
      <rect x={viewX} y={viewY} width={viewW} height={viewH} fill={PALETTE.paper} />
      <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="url(#blueprint-grid)" />

      <text x={bounds.x} y={viewY + 3.2} fill={PALETTE.text} fontSize={2.4} fontWeight={700} fontFamily="Inter, Arial, sans-serif">
        GROUND FLOOR PLAN
      </text>
      <text x={bounds.x} y={viewY + 5.4} fill={PALETTE.muted} fontSize={1.5} fontFamily="Inter, Arial, sans-serif">
        {`Footprint ${plan.length} x ${plan.width} ft | Total room area ${Math.round(totalRoomArea)} sq ft`}
      </text>

      {plan.balconies.map((balcony) => {
        const r = balcony.rect;
        return (
          <g key={balcony.id}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={PALETTE.dim} fillOpacity={0.12} stroke="none" />
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={PALETTE.wall} strokeWidth={0.25} strokeDasharray="1 0.6" />
            <text
              x={r.x + r.w / 2}
              y={r.y + r.h / 2}
              textAnchor="middle"
              fill={PALETTE.muted}
              fontSize={Math.min(1.2, BALCONY_DEPTH / 4)}
              fontFamily="Inter, Arial, sans-serif"
            >
              {`Balcony (${balcony.side})`}
            </text>
          </g>
        );
      })}

      {plan.rooms.map((room) => (
        <rect
          key={`fill-${room.id}`}
          x={room.rect.x}
          y={room.rect.y}
          width={room.rect.w}
          height={room.rect.h}
          fill={ROOM_TINT[room.kind]}
          fillOpacity={0.16}
        />
      ))}

      {plan.stair.steps.map((step, i) => (
        <rect
          key={`step-${i}`}
          x={step.rect.x}
          y={step.rect.y}
          width={step.rect.w}
          height={step.rect.h}
          fill="none"
          stroke={PALETTE.dim}
          strokeWidth={0.1}
        />
      ))}
      {plan.stair.steps.length > 1 && (
        <g stroke={PALETTE.dim} strokeWidth={0.15} fill={PALETTE.dim}>
          <line
            x1={plan.stair.steps[0].rect.x + plan.stair.steps[0].rect.w / 2}
            y1={plan.stair.steps[0].rect.y + plan.stair.steps[0].rect.h / 2}
            x2={plan.stair.steps[plan.stair.steps.length - 1].rect.x + plan.stair.steps[plan.stair.steps.length - 1].rect.w / 2}
            y2={plan.stair.steps[plan.stair.steps.length - 1].rect.y + plan.stair.steps[plan.stair.steps.length - 1].rect.h / 2}
            strokeDasharray="0.8 0.5"
          />
        </g>
      )}

      {plan.walls.map((wall, i) => (
        <line
          key={`wall-${i}`}
          x1={wall.a.x}
          y1={wall.a.y}
          x2={wall.b.x}
          y2={wall.b.y}
          stroke={PALETTE.wall}
          strokeWidth={WALL_THICKNESS}
          strokeLinecap="square"
        />
      ))}

      {plan.openings.map((opening, i) =>
        opening.kind === 'door' ? (
          <DoorSymbol key={`open-${i}`} opening={opening} />
        ) : (
          <WindowSymbol key={`open-${i}`} opening={opening} />
        )
      )}

      {plan.rooms.map((room) => (
        <RoomLabel key={`label-${room.id}`} room={room} />
      ))}

      <g stroke={PALETTE.dim} strokeWidth={0.12} fill={PALETTE.dim} fontFamily="Inter, Arial, sans-serif">
        <line x1={footprint.x} y1={dimY} x2={footprint.x + footprint.w} y2={dimY} />
        <line x1={footprint.x} y1={dimY - 0.8} x2={footprint.x} y2={dimY + 0.8} />
        <line x1={footprint.x + footprint.w} y1={dimY - 0.8} x2={footprint.x + footprint.w} y2={dimY + 0.8} />
        <text x={footprint.x + footprint.w / 2} y={dimY + 2.2} textAnchor="middle" stroke="none" fontSize={1.6}>
          {`${plan.length} ft`}
        </text>
        <line x1={dimX} y1={footprint.y} x2={dimX} y2={footprint.y + footprint.h} />
        <line x1={dimX - 0.8} y1={footprint.y} x2={dimX + 0.8} y2={footprint.y} />
        <line x1={dimX - 0.8} y1={footprint.y + footprint.h} x2={dimX + 0.8} y2={footprint.y + footprint.h} />
        <text x={dimX + 1.5} y={footprint.y + footprint.h / 2} stroke="none" fontSize={1.6}>
          {`${plan.width} ft`}
        </text>
      </g>
    </svg>
  );
}
