import { Inject } from '@nestjs/common';
import { ICouponRepository } from '../domain/coupon.repository';
import { Coupon, CouponIssue } from '../domain/coupon';
import { PrismaService } from 'src/prisma/prisma.service';
import { plainToInstance } from 'class-transformer'; // class-transformer 패키지 필요

export const CouponRepositoryToken = Symbol('CouponRepository');

export class CouponRepository implements ICouponRepository {
  constructor(
    @Inject(CouponRepositoryToken)
    private readonly couponRepository: ICouponRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getCouponList(): Promise<Coupon[]> {
    const result = await this.prisma.$queryRawUnsafe<Coupon[]>(`
      SELECT c.*
      FROM Coupon c
      INNER JOIN CouponLimit cl ON c.couponId = cl.couponId
      WHERE cl.limit > cl.issued
    `);
    return result;
  }

  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]> {
    return this.prisma.couponIssue
      .findMany({
        where: {
          userId: userId,
        },
        include: {
          coupon: true,
        },
      })
      .then((results) => {
        return results.map((result) =>
          plainToInstance(CouponIssue, {
            ...result,
            ...result.coupon,
          }),
        );
      });
  }

  getCouponIssue(couponIssueId: number): Promise<CouponIssue> {
    return this.prisma.couponIssue
      .findUnique({
        where: {
          couponIssueId: couponIssueId,
        },
        include: {
          coupon: true,
        },
      })
      .then((result) => {
        return plainToInstance(CouponIssue, {
          ...result,
          ...result.coupon,
        });
      });
  }

  createCouponIssue(couponId: number, userId: number): Promise<CouponIssue> {
    return this.prisma.couponIssue
      .create({
        data: {
          couponId: couponId,
          userId: userId,
        },
      })
      .then((result) => plainToInstance(CouponIssue, result));
  }

  updateCouponIssueUsed(couponIssueId: number): Promise<void> {
    this.prisma.couponIssue.update({
      where: {
        couponIssueId: couponIssueId,
      },
      data: {
        used: true,
      },
    });
    return;
  }

  isOnIssue(couponId: number): Promise<boolean> {
    return this.prisma.couponLimit
      .findUnique({
        where: {
          couponId,
        },
      })
      .then((result) => {
        return result.limit > result.issued;
      });
  }

  addIssueCount(couponId: number): Promise<void> {
    this.prisma.couponLimit.update({
      where: {
        couponId,
      },
      data: {
        issued: {
          increment: 1,
        },
      },
    });
    return;
  }
}
