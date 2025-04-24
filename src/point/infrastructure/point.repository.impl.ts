import { Injectable } from '@nestjs/common';
import { IPointRepository } from '../domain/point.repository';
import { PointHistory, TransactionType, UserPoint } from '../domain/point';
import { PointHistoryCriteria } from '../application/point.application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

export const PointRepositoryToken = 'PointRepositoryToken';
@Injectable()
export class PointRepository implements IPointRepository {
  constructor(private readonly prisma: PrismaService) {}
  async getPointByUser(userId: number): Promise<number> {
    const result = await this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });
    if (!result) throw new Error('User not found');
    return result.point;
  }
  async getPointHistory(userId: number): Promise<PointHistory[]> {
    const results = await this.prisma.pointHistory.findMany({
      where: { userId },
    });
    return results.map((result) => ({
      ...result,
      type: result.type as TransactionType,
    }));
  }
  async updatePointBalance(
    userId: number,
    balanceBefore: number,
    balanceAfter: number,
  ): Promise<UserPoint> {
    return await this.prisma.user.update({
      where: { userId, point: balanceBefore },
      data: { point: balanceAfter },
    });
  }
  async createPointHistory(criteria: PointHistoryCriteria): Promise<boolean> {
    try {
      await this.prisma.pointHistory.create({
        data: {
          ...criteria,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to create point history:', error);
      return false;
    }
  }
}
