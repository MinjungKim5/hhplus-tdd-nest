import { Inject } from '@nestjs/common';
import { ICouponRepository } from '../domain/coupon.repository';
import { Coupon, CouponIssue } from '../domain/coupon';
import { PrismaService } from 'src/prisma/prisma.service';
import { plainToInstance } from 'class-transformer'; // class-transformer 패키지 필요

export const CouponRepositoryToken = Symbol('CouponRepository');

export class CouponRepository implements ICouponRepository {
  constructor(
    @Inject(CouponRepositoryToken)
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

  async getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]> {
    const results = await this.prisma.couponIssue.findMany({
      where: {
        userId: userId,
      },
      include: {
        coupon: true,
      },
    });
    return results.map((result) =>
      plainToInstance(CouponIssue, {
        ...result,
        ...result.coupon,
      }),
    );
  }

  async getCouponIssue(couponIssueId: number): Promise<CouponIssue> {
    try {
      const result = await this.prisma.couponIssue.findUniqueOrThrow({
        where: {
          couponIssueId: couponIssueId,
        },
        include: {
          coupon: true,
        },
      });
      const { coupon, ...couponIssueInfo } = result;
      return { ...couponIssueInfo, ...coupon };
    } catch (error) {
      return null;
    }
  }

  async createCouponIssue(
    couponId: number,
    userId: number,
  ): Promise<CouponIssue> {
    const result = await this.prisma.couponIssue.create({
      data: {
        couponId: couponId,
        userId: userId,
      },
    });
    return plainToInstance(CouponIssue, result);
  }

  async updateCouponIssueUsed(couponIssueId: number): Promise<void> {
    await this.prisma.couponIssue.update({
      where: {
        couponIssueId: couponIssueId,
      },
      data: {
        used: true,
      },
    });
    return;
  }

  async isOnIssue(couponId: number): Promise<boolean> {
    const result = await this.prisma.couponLimit.findUnique({
      where: {
        couponId,
      },
    });
    return result.limit > result.issued;
  }

  async addIssueCount(couponId: number): Promise<void> {
    await this.prisma.couponLimit.update({
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
