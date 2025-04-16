import { Injectable } from '@nestjs/common';
import { IPointRepository } from '../domain/point.repository';
import { PointHistory, TransactionType, UserPoint } from '../domain/point';
import { PointHistoryCriteria } from '../application/point.application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

export const PointRepositoryToken = 'PointRepositoryToken';
@Injectable()
export class PointRepository implements IPointRepository {
  constructor(private readonly prisma: PrismaService) {}
  getPointByUser(userId: number): Promise<number> {
    return this.prisma.user
      .findUnique({
        where: {
          userId: userId,
        },
      })
      .then((result) => {
        if (!result) throw new Error('User not found');
        return result.point;
      });
  }
  getPointHistory(userId: number): Promise<PointHistory[]> {
    return this.prisma.pointHistory
      .findMany({
        where: { userId },
      })
      .then((results) =>
        results.map((result) => ({
          ...result,
          type: result.type as TransactionType,
        })),
      );
  }
  updatePointBalance(userId: number, balance: number): Promise<UserPoint> {
    return this.prisma.user.update({
      where: { userId },
      data: { point: balance },
    });
  }
  createPointHistory(criteria: PointHistoryCriteria): Promise<boolean> {
    return this.prisma.pointHistory
      .create({
        data: {
          ...criteria,
        },
      })
      .then(() => true)
      .catch((error) => {
        console.error('Failed to create point history:', error);
        return false;
      });
  }
}
