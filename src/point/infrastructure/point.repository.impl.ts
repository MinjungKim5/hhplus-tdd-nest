import { Injectable } from '@nestjs/common';
import { IPointRepository } from '../domain/point.repository';
import { PointHistory, UserPoint } from '../domain/point';
import { PointHistoryCriteria } from '../application/point.application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

export const PointRepositoryToken = 'PointRepositoryToken';
@Injectable()
export class PointRepository implements IPointRepository {
  constructor(private readonly prisma: PrismaService) {}
  getPointByUser(userId: number): Promise<number> {
    throw new Error('Method not implemented.');
  }
  getPointHistory(userId: number): Promise<PointHistory[]> {
    throw new Error('Method not implemented.');
  }
  updatePointBalance(userId: number, balance: number): Promise<UserPoint> {
    throw new Error('Method not implemented.');
  }
  createPointHistory(criteria: PointHistoryCriteria): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
