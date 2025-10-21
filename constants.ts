import { FractionEnum, StatusEnum, RequestTypeEnum, type Fraction, type Status, type ContainerRequest, type InventoryItem } from './types';

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

export const INITIAL_REQUESTS: ContainerRequest[] = [
    {
        id: '1',
        establishment: 'Establecimiento A',
        items: [
            { fractionId: FractionEnum.ENVASES, capacity: 120, requestType: RequestTypeEnum.ADD },
            { fractionId: FractionEnum.RESTA, capacity: 1100, requestType: RequestTypeEnum.ADD }
        ],
        statusId: StatusEnum.SIN_STOCK,
        date: '2024-07-22T09:00:00Z'
    },
    {
        id: '2',
        establishment: 'Establecimiento B',
        items: [
            { fractionId: FractionEnum.ORGANICA, capacity: 240, requestType: RequestTypeEnum.ADD },
            { fractionId: FractionEnum.VIDRIO, capacity: 40, requestType: RequestTypeEnum.REMOVE }
        ],
        statusId: StatusEnum.EN_PREPARACION,
        date: '2024-07-23T16:20:00Z'
    },
    {
        id: '3',
        establishment: 'Establecimiento C',
        items: [
            { fractionId: FractionEnum.PAPEL_CARTON, capacity: 240, requestType: RequestTypeEnum.ADD },
        ],
        statusId: StatusEnum.REALIZADO,
        date: '2024-07-19T14:00:00Z'
    },
    {
        id: '4',
        establishment: 'Establecimiento A',
        items: [
            { fractionId: FractionEnum.VIDRIO, capacity: 240, requestType: RequestTypeEnum.ADD },
        ],
        statusId: StatusEnum.SIN_STOCK,
        date: '2024-07-25T15:00:00Z'
    }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
    { fractionId: FractionEnum.RESTA, capacity: 120, quantity: 10, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.RESTA, capacity: 1100, quantity: 0, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.ENVASES, capacity: 120, quantity: 5, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.PAPEL_CARTON, capacity: 240, quantity: 8, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.ORGANICA, capacity: 240, quantity: 3, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.VIDRIO, capacity: 40, quantity: 15, lastUpdated: new Date().toISOString() },
    { fractionId: FractionEnum.VIDRIO, capacity: 240, quantity: 0, lastUpdated: new Date().toISOString() },
];
