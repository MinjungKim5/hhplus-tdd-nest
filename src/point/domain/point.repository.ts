import { PointHistoryCriteria } from '../application/point.criteria';
import { PointHistory, UserPoint } from './point';

export interface PointRepository {
  getPointByUser(userId: number): Promise<number>;
  getPointHistory(userId: number): Promise<PointHistory[]>;
  updatePoint(userId: number, balanceAfterCharge: number): Promise<UserPoint>;
  createPointHistory(criteria: PointHistoryCriteria): Promise<boolean>;
}
