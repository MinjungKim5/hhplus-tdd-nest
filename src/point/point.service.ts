import { Inject } from '@nestjs/common';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPointTable } from '../database/userpoint.table';
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
      throw new Error('포인트 적립/사용 내역이 없습니다.'); // 굳이 오류로 처리할 필요는 없을듯?
    return result;
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterCharge = currentPoint.point + amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterCharge);
    const result = await this.pointTable.insertOrUpdate(
      userId,
      balanceAfterCharge,
    );
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
    const balanceAfterUse = currentPoint.point - amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterUse);
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

  balanceExceptionCheck(balance: number) {
    const lowerLimit = 0;
    if (balance < lowerLimit) throw new Error('잔액이 부족합니다.');
    const upperLimit = 10000;
    if (balance > upperLimit) throw new Error('충전 한도를 초과했습니다.');
  }
}
