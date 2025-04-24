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
    try {
      const result = await this.prisma.couponIssue.create({
        data: {
          couponId: couponId,
          userId: userId,
        },
      });
      return plainToInstance(CouponIssue, result);
    } catch (error) {
      throw new Error('쿠폰 발급에 실패했습니다. 이미 발급된 쿠폰입니다.');
    }
  }

  async updateCouponIssueUsed(couponIssueId: number): Promise<void> {
    try {
      await this.prisma.couponIssue.update({
        where: {
          couponIssueId: couponIssueId,
          used: false,
        },
        data: {
          used: true,
        },
      });
    } catch (error) {
      throw new Error('쿠폰 사용에 실패했습니다. 이미 사용된 쿠폰입니다.');
    }
  }

  async getIssueCountAndLimit(
    couponId: number,
  ): Promise<{ issued: number; limit: number }> {
    const result = await this.prisma.couponLimit.findUnique({
      where: {
        couponId,
      },
    });
    return { issued: result.issued, limit: result.limit };
  }

  async addIssueCount(couponId: number, issued: number): Promise<void> {
    const result = await this.prisma.couponLimit.updateMany({
      where: {
        couponId,
        issued, // 현재 발급 수량과 일치하는 경우에만 업데이트
      },
      data: {
        issued: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      throw new Error('쿠폰 발급에 실패했습니다. 선착순 마감되었습니다.');
    }
  }
}
