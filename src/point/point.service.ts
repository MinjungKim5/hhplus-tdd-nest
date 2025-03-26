import { Inject } from '@nestjs/common';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

export class PointService {
  constructor(
    @Inject(UserPointTable)
    private readonly pointTable: UserPointTable,
    @Inject(PointHistoryTable)
    private readonly pointHistory: PointHistoryTable,
  ) {}
  async getPointByUser(userId: number): Promise<UserPoint> {
    const result = await this.pointTable.selectById(userId);
    if (!result) throw new Error('조회 결과가 없습니다.');
    return result;
  }

  async getPointHistoryByUser(userId: number): Promise<PointHistory[]> {
    const result = await this.pointHistory.selectAllByUserId(userId);
    if (result.length === 0)
      throw new Error('포인트 적립/사용 내역이 없습니다.');
    return result;
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    // 포인트 잔액에 대한 예외처리
    const balanceAfterCharge = currentPoint.point + amount;
    const result = await this.pointTable.insertOrUpdate(userId, amount);
    await this.pointHistory.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      result.updateMillis,
    );
    // point lock 반환
    return result;
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    // 포인트 잔액에 대한 예외처리
    const balanceAfterUse = currentPoint.point - amount;
    const result = await this.pointTable.insertOrUpdate(
      userId,
      balanceAfterUse,
    );
    await this.pointHistory.insert(
      userId,
      amount,
      TransactionType.USE,
      result.updateMillis,
    );
    // point lock 반환
    return result;
  }
}
