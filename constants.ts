import { FractionEnum, StatusEnum, type Fraction, type Status } from './types';

export const FRACTIONS: Fraction[] = [
  { id: FractionEnum.RESTA, name: 'Resta', color: 'bg-gray-500', textColor: 'text-gray-500', capacities: [40, 120, 240, 1100] },
  { id: FractionEnum.ENVASES, name: 'Envases', color: 'bg-yellow-400', textColor: 'text-yellow-400', capacities: [40, 120, 240, 1100] },
  { id: FractionEnum.PAPEL_CARTON, name: 'Papel y Cartón', color: 'bg-blue-600', textColor: 'text-blue-600', capacities: [40, 120, 240, 1100] },
  { id: FractionEnum.ORGANICA, name: 'Orgánica', color: 'bg-amber-800', textColor: 'text-amber-800', capacities: [40, 120, 240] },
  { id: FractionEnum.VIDRIO, name: 'Vidrio', color: 'bg-green-600', textColor: 'text-green-600', capacities: [40, 120, 240] },
];

export const STATUSES: Status[] = [
  { id: StatusEnum.REALIZADO, name: 'Cambio realizado', color: 'bg-green-100', textColor: 'text-green-800' },
  { id: StatusEnum.SIN_STOCK, name: 'No hay stock disponible', color: 'bg-cyan-100', textColor: 'text-cyan-800' },
  { id: StatusEnum.EN_PREPARACION, name: 'Hay stock y está en preparación', color: 'bg-violet-100', textColor: 'text-violet-800' },
];
