import { Inject, Injectable } from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from '../domain/point';
import { IPointRepository } from '../domain/point.repository';
import { PointRepositoryToken } from '../infrastructure/point.repository.impl';
import { PointHistoryResponse } from './point.application.dto';
import { UserLock } from 'src/user/infrastructure/user.lock';
@Injectable()
export class PointService {
  constructor(
    @Inject(PointRepositoryToken)
    private readonly pointRepository: IPointRepository,
    private readonly userLock: UserLock,
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
    const lock = await this.userLock.acquireUserLock(userId);
    try {
      const currentPoint = await this.getPointByUser(userId);
      const balanceAfterCharge = currentPoint + amount;

      // 포인트 잔액에 대한 예외처리
      this.balanceExceptionCheck(balanceAfterCharge);
      const result = await this.pointRepository.updatePointBalance(
        userId,
        currentPoint,
        balanceAfterCharge,
      );
      await this.pointRepository.createPointHistory({
        userId,
        amount,
        type: 'charge',
      });
      return { point: result.point };
    } catch (error) {
      throw new Error(`포인트 충전 실패: ${error}`);
    } finally {
      // 락 해제
      if (lock) {
        await this.userLock.releaseUserLock(lock);
      }
    }
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    const currentPoint = await this.getPointByUser(userId);
    const balanceAfterUse = currentPoint - amount;
    // 포인트 잔액에 대한 예외처리
    this.balanceExceptionCheck(balanceAfterUse);
    const result = await this.pointRepository.updatePointBalance(
      userId,
      currentPoint,
      balanceAfterUse,
    );
    await this.pointRepository.createPointHistory({
      userId,
      amount,
      type: 'use',
    });
    return { point: result.point };
  }

  /* 포인트는 분산락 사용으로 트랜잭션에서 제외
  async usePointWithTransaction(
    ctx: IRepositoryContext,
    userId: number,
    amount: number,
  ): Promise<void> {
    const currentPoint = await ctx.pointRepository.getPointByUser(userId);
    const balanceAfterUse = currentPoint - amount;

    this.balanceExceptionCheck(balanceAfterUse);

    await ctx.pointRepository.updatePointBalance(
      userId,
      currentPoint,
      balanceAfterUse,
    );

    await ctx.pointRepository.createPointHistory({
      userId,
      amount,
      type: 'use',
    });
  }
  */

  balanceExceptionCheck(balance: number) {
    const lowerLimit = 0;
    if (balance < lowerLimit) throw new Error('잔액이 부족합니다.');
    const upperLimit = 10000000;
    if (balance > upperLimit) throw new Error('최대 잔액 한도를 초과했습니다.');
  }
}
