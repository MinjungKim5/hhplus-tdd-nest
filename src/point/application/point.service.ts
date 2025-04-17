import { Inject, Injectable } from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from '../domain/point';
import { IPointRepository } from '../domain/point.repository';
import { PointRepositoryToken } from '../infrastructure/point.repository.impl';
import { PointHistoryResponse } from './point.application.dto';
@Injectable()
export class PointService {
  constructor(
    @Inject(PointRepositoryToken)
    private readonly pointRepository: IPointRepository,
  ) {}
  async getPointByUser(userId: number): Promise<number> {
    return await this.pointRepository.getPointByUser(userId);
  }

  async getPointHistoryByUser(userId: number): Promise<PointHistoryResponse[]> {
    const pointHistory = await this.pointRepository.getPointHistory(userId);
    return pointHistory.map((history) => {
      return {
        id: history.id,
        amount: history.amount,
        type: history.type,
        createdAt: history.createdAt,
      };
    });
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterCharge = currentPoint + amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterCharge);
    const result = await this.pointRepository.updatePointBalance(
      userId,
      balanceAfterCharge,
    );
    if (!result) throw new Error('포인트 저장 실패');
    await this.pointRepository.createPointHistory({
      userId,
      amount,
      type: 'charge',
    });
    // point lock 반환
    return { point: result.point };
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // point lock 획득
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterUse = currentPoint - amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterUse);
    const result = await this.pointRepository.updatePointBalance(
      userId,
      balanceAfterUse,
    );
    if (!result) throw new Error('포인트 저장 실패');
    await this.pointRepository.createPointHistory({
      userId,
      amount,
      type: 'use',
    });
    // point lock 반환
    return { point: result.point };
  }

  balanceExceptionCheck(balance: number) {
    const lowerLimit = 0;
    if (balance < lowerLimit) throw new Error('잔액이 부족합니다.');
    const upperLimit = 10000000;
    if (balance > upperLimit) throw new Error('최대 잔액 한도를 초과했습니다.');
  }
}
