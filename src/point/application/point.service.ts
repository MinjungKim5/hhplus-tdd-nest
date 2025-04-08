import { Inject } from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from '../domain/point';
import { PointRepository } from '../domain/point.repository';
import { PointResDto } from '../controller/point.dto';

export class PointService {
  constructor(
    @Inject()
    private readonly pointRepository: PointRepository,
  ) {}
  async getPointByUser(userId: number): Promise<number> {
    return await this.pointRepository.getPointByUser(userId);
  }

  async getPointHistoryByUser(userId: number): Promise<PointHistory[]> {
    return await this.pointRepository.getPointHistory(userId);
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterCharge = currentPoint + amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterCharge);
    const result = await this.pointRepository.updatePoint(
      userId,
      balanceAfterCharge,
    );
    if (!result) throw new Error('포인트 저장 실패');
    await this.pointRepository.createPointHistory({
      userId,
      amount,
      type: TransactionType.CHARGE,
    });
    // point lock 반환
    return result;
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterUse = currentPoint - amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterUse);
    const result = await this.pointRepository.updatePoint(
      userId,
      balanceAfterUse,
    );
    if (!result) throw new Error('포인트 저장 실패');
    await this.pointRepository.createPointHistory({
      userId,
      amount,
      type: TransactionType.USE,
    });
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
