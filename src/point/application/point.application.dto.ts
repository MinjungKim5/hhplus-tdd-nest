import { PointHistory } from '../domain/point';

export type PointHistoryCriteria = Omit<PointHistory, 'id' | 'createdAt'>;

export type PointHistoryResponse = Omit<PointHistory, 'userId'>;
