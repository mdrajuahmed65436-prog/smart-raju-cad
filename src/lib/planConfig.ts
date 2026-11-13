import type { PlanConfig } from '@/types/plan';

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  lengthFt: 40,
  widthFt: 30,
  bedrooms: [
    { id: 'bed-1', name: 'Master Bedroom' },
    { id: 'bed-2', name: 'Bedroom 2' },
  ],
  bathrooms: 2,
  kitchens: 1,
  diningRooms: [{ id: 'din-1', name: 'Dining Room' }],
  balconies: ['Front'],
  staircasePosition: 'Left',
  staircaseType: 'Straight',
  roofType: 'Sloped',
  doorStyle: 'Wooden Panel',
  windowStyle: 'Glass Casement',
  sunHours: 4.5,
};

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}
