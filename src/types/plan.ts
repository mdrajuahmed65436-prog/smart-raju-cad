export const BALCONY_SIDES = ['Front', 'Back', 'Left', 'Right'] as const;
export type BalconySide = (typeof BALCONY_SIDES)[number];

export const STAIRCASE_POSITIONS = ['Left', 'Right', 'Center', 'Exterior'] as const;
export type StaircasePosition = (typeof STAIRCASE_POSITIONS)[number];

export const STAIRCASE_TYPES = ['Straight', 'L-Shape', 'U-Shape'] as const;
export type StaircaseType = (typeof STAIRCASE_TYPES)[number];

export const ROOF_TYPES = ['Flat', 'Sloped'] as const;
export type RoofType = (typeof ROOF_TYPES)[number];

export const DOOR_STYLES = ['Wooden Panel', 'Glass Sliding', 'Modern Flush'] as const;
export type DoorStyle = (typeof DOOR_STYLES)[number];

export const WINDOW_STYLES = ['Glass Casement', 'Wooden Frame', 'Sliding Glass'] as const;
export type WindowStyle = (typeof WINDOW_STYLES)[number];

export type RoofView = 'solid' | 'transparent' | 'hidden';

export interface NamedRoom {
  id: string;
  name: string;
}

export interface PlanConfig {
  lengthFt: number;
  widthFt: number;
  bedrooms: NamedRoom[];
  bathrooms: number;
  kitchens: number;
  diningRooms: NamedRoom[];
  balconies: BalconySide[];
  staircasePosition: StaircasePosition;
  staircaseType: StaircaseType;
  roofType: RoofType;
  doorStyle: DoorStyle;
  windowStyle: WindowStyle;
  sunHours: number;
}

export const LIMITS = {
  dimMin: 20,
  dimMax: 80,
  bedroomsMax: 6,
  bathroomsMax: 6,
  kitchensMax: 2,
  diningMax: 3,
  sunHoursMin: 2,
  sunHoursMax: 8,
} as const;
