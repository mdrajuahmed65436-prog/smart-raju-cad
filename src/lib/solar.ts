import type { FloorPlan } from '@/lib/floorPlan';
import type { RoofType } from '@/types/plan';

export const PANEL = { length: 5.5, width: 3, watts: 550 } as const;
export const ROOF_PITCH_DEG = 30;
export const SYSTEM_EFFICIENCY = 0.8;

const SETBACK_FT = 2;
const FLAT_ROW_GAP_FT = 3;
const SLOPE_ROW_GAP_FT = 1;

export interface PanelCell {
  u: number;
  v: number;
}

export interface SolarFace {
  kind: 'flat' | 'slope';
  side: 'A' | 'B' | null;
  panels: PanelCell[];
}

export interface SolarResult {
  faces: SolarFace[];
  slopeLength: number;
  panelCount: number;
  kWp: number;
  dailyKwh: number;
  monthlyKwh: number;
  annualKwh: number;
  roofArea: number;
  coveredArea: number;
}

function gridFor(uLength: number, vLength: number, rowGap: number): PanelCell[] {
  const cols = Math.max(0, Math.floor((uLength - 2 * SETBACK_FT) / PANEL.length));
  const usableV = vLength - 2 * SETBACK_FT;
  const rows = Math.max(0, Math.floor((usableV + rowGap) / (PANEL.width + rowGap)));
  const gridU = cols * PANEL.length;
  const gridV = rows * PANEL.width + Math.max(0, rows - 1) * rowGap;
  const offU = (uLength - gridU) / 2;
  const offV = (vLength - gridV) / 2;
  const panels: PanelCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      panels.push({ u: offU + c * PANEL.length, v: offV + r * (PANEL.width + rowGap) });
    }
  }
  return panels;
}

export function computeSolar(plan: FloorPlan, roofType: RoofType, sunHours: number): SolarResult {
  const X = plan.length;
  const D = plan.width;
  const pitch = (ROOF_PITCH_DEG * Math.PI) / 180;
  const slopeLength = D / 2 / Math.cos(pitch);

  const faces: SolarFace[] =
    roofType === 'Flat'
      ? [{ kind: 'flat', side: null, panels: gridFor(X, D, FLAT_ROW_GAP_FT) }]
      : [
          { kind: 'slope', side: 'A', panels: gridFor(X, slopeLength, SLOPE_ROW_GAP_FT) },
          { kind: 'slope', side: 'B', panels: gridFor(X, slopeLength, SLOPE_ROW_GAP_FT) },
        ];

  const panelCount = faces.reduce((sum, f) => sum + f.panels.length, 0);
  const kWp = (panelCount * PANEL.watts) / 1000;
  const dailyKwh = kWp * sunHours * SYSTEM_EFFICIENCY;
  const roofArea = roofType === 'Flat' ? X * D : 2 * X * slopeLength;

  return {
    faces,
    slopeLength,
    panelCount,
    kWp,
    dailyKwh,
    monthlyKwh: dailyKwh * 30,
    annualKwh: dailyKwh * 365,
    roofArea,
    coveredArea: panelCount * PANEL.length * PANEL.width,
  };
}
