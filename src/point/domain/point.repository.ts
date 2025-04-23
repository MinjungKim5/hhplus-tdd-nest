import { PointHistoryCriteria } from '../application/point.application.dto';
import { PointHistory, UserPoint } from './point';

export interface IPointRepository {
  getPointByUser(userId: number): Promise<number>;
  getPointHistory(userId: number): Promise<PointHistory[]>;
  updatePointBalance(
    userId: number,
    balanceBefore: number,
    balanceAfter: number,
  ): Promise<UserPoint>;
  createPointHistory(criteria: PointHistoryCriteria): Promise<boolean>;
}
