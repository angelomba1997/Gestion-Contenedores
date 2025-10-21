export enum FractionEnum {
  RESTA = 'RESTA',
  ENVASES = 'ENVASES',
  PAPEL_CARTON = 'PAPEL_CARTON',
  ORGANICA = 'ORGANICA',
  VIDRIO = 'VIDRIO',
}

export enum StatusEnum {
  REALIZADO = 'REALIZADO',
  SIN_STOCK = 'SIN_STOCK',
  EN_PREPARACION = 'EN_PREPARACION',
}

export enum RequestTypeEnum {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export type Capacity = 40 | 120 | 240 | 1100;

export interface Fraction {
  id: FractionEnum;
  name: string;
  color: string;
  textColor: string;
  capacities: Capacity[];
}

export interface Status {
  id: StatusEnum;
  name: string;
  color: string;
  textColor: string;
}

export interface RequestItemDetail {
  fractionId: FractionEnum;
  capacity: Capacity;
  requestType: RequestTypeEnum;
}

export interface ContainerRequest {
  id: string;
  establishment: string;
  items: RequestItemDetail[];
  statusId: StatusEnum;
  statusDetail?: string;
  date: string;
  observations?: string;
}

export interface Filters {
    fractionId: FractionEnum | 'ALL';
    capacity: Capacity | 'ALL';
    statusId: StatusEnum | 'ALL';
    establishment: string | 'ALL';
}

export interface InventoryItem {
  fractionId: FractionEnum;
  capacity: Capacity;
  quantity: number;
  lastUpdated: string;
}