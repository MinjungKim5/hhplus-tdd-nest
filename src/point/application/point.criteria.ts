import { PointHistory } from '../domain/point';

export type PointHistoryCriteria = Omit<PointHistory, 'id' | 'createdAt'>;
