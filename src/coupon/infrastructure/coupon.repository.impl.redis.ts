import { Inject } from '@nestjs/common';
import { ICouponRepository } from '../domain/coupon.repository';
import { Coupon, CouponIssue } from '../domain/coupon';
import { PrismaService } from 'src/util/prisma/prisma.service';
import { plainToInstance } from 'class-transformer'; // class-transformer 패키지 필요
import Redis from 'ioredis';

export const CouponRepositoryWithRedisToken = 'CouponRepositoryWithRedisToken';

export class CouponRepositoryWithReids implements ICouponRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
  ) {}

  // 쿠폰 발행량: limit, 발급량: issued
  // 쿠폰은 발행량까지 사용자에게 발급 가능

  // 원하는 갯수만큼 선착순 쿠폰 발행
  async publishCoupon(couponId: number, limit: number): Promise<void> {
    const couponData = await this.prisma.coupon.findUnique({
      where: { couponId: couponId },
    });
    await this.redis.hset(`coupon:${couponId}`, {
      couponId: couponId,
      name: couponData.name,
      couponType: couponData.couponType,
      benefit: couponData.benefit,
      maxDiscount: couponData.maxDiscount,
      minPrice: couponData.minPrice,
      dueDate: couponData.dueDate,
    });
    await this.redis.hset(`couponLimit:${couponId}`, {
      limit: limit,
      issued: 0,
    });
    await this.redis.set(`couponIssuable:${couponId}`, 'true');
  }

  async getCouponList(): Promise<Coupon[]> {
    const cachedCouponList = await this.redis.get('couponList');
    if (cachedCouponList) {
      return JSON.parse(cachedCouponList);
    }

    const couponIds = await this.redis.keys('coupon');
    const coupons = await Promise.all(
      couponIds.map(async (couponId) => {
        const couponData = await this.redis.hgetall(couponId);
        return this.mapRedisToCoupon(couponData);
      }),
    );

    await this.redis.set('couponList', JSON.stringify(coupons), 'EX', 60 * 60);

    return coupons;
  }

  private mapRedisToCoupon(couponData: Record<string, string>): Coupon {
    return {
      couponId: Number(couponData.couponId),
      name: couponData.name,
      couponType: couponData.couponType,
      benefit: Number(couponData.benefit),
      maxDiscount: Number(couponData.maxDiscount),
      minPrice: Number(couponData.minPrice),
      dueDate: new Date(couponData.dueDate),
    };
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

  async getCouponIssue(userId: number, couponId: number): Promise<CouponIssue> {
    try {
      const cachedCouponIssue = await this.redis.hgetall(
        `couponIssue:userId:${userId}:couponId:${couponId}`,
      );
      if (cachedCouponIssue) {
        return this.mapRedisToCouponIssue(cachedCouponIssue);
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    const couponIssue = await this.prisma.couponIssue.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: couponId,
        },
      },
      include: {
        coupon: true,
      },
    });
    const coupon = couponIssue.coupon;
    await this.redis.hset(`couponIssue:userId:${userId}:couponId:${couponId}`, {
      userId: couponIssue.userId,
      createdAt: couponIssue.createdAt.toISOString(),
      updatedAt: couponIssue.updatedAt.toISOString(),
      used: couponIssue.used,
      couponId: couponIssue.couponId,
      name: coupon.name,
      couponType: coupon.couponType,
      benefit: coupon.benefit,
      maxDiscount: coupon.maxDiscount,
      minPrice: coupon.minPrice,
      dueDate: coupon.dueDate.toISOString(),
    });
  }

  private mapRedisToCouponIssue(
    couponIssueData: Record<string, string>,
  ): CouponIssue {
    return {
      userId: Number(couponIssueData.userId),
      createdAt: new Date(couponIssueData.createdAt),
      used: couponIssueData.used === 'true',
      couponId: Number(couponIssueData.couponId),
      name: couponIssueData.name,
      couponType: couponIssueData.couponType,
      benefit: Number(couponIssueData.benefit),
      maxDiscount: Number(couponIssueData.maxDiscount),
      minPrice: Number(couponIssueData.minPrice),
      dueDate: new Date(couponIssueData.dueDate),
    };
  }

  async createCouponIssue(
    userId: number,
    couponId: number,
  ): Promise<CouponIssue> {
    const couponRecord = await this.redis.hgetall(`coupon:${couponId}`);
    if (!couponRecord) {
      throw new Error('쿠폰이 존재하지 않거나 발급 불가능한 쿠폰입니다.');
    }
    const coupon = this.mapRedisToCoupon(couponRecord);
    const limitData = await this.redis.hgetall(`couponLimit:${couponId}`);
    const limit = Number(limitData.limit);
    const issued = Number(limitData.issued);
    if (issued >= limit) {
      throw new Error('쿠폰 발급에 실패했습니다. 선착순 마감되었습니다.');
    }
    await this.redis.watch(`couponIssuable:${couponId}`);
    const isIssuable = await this.redis.get(`couponIssuable:${couponId}`);
    if (isIssuable !== 'true') {
      throw new Error('쿠폰 발급에 실패했습니다. 선착순 마감되었습니다.');
    }
    const pipeline = this.redis.multi();
    pipeline.hincrby(`couponLimit:${couponId}`, 'issued', 1);
    const couponIssue = {
      userId: userId,
      createdAt: new Date(),
      used: false,
      couponId: couponId,
      name: coupon.name,
      couponType: coupon.couponType,
      benefit: coupon.benefit,
      maxDiscount: coupon.maxDiscount,
      minPrice: coupon.minPrice,
      dueDate: coupon.dueDate,
    };
    const couponIssueData = {
      ...CouponIssue,
      createdAt: couponIssue.createdAt.toISOString(),
      updatedAt: couponIssue.createdAt.toISOString(),
      dueDate: couponIssue.dueDate.toISOString(),
    };
    pipeline.hset(
      `couponIssue:userId:${userId}:couponId:${couponId}`,
      couponIssueData,
    );
    await pipeline.exec();
    if (limit === issued + 1) {
      await this.redis.set(`couponIssuable:${couponId}`, 'false');
      await this.redis.del(`coupon:${couponId}`);
    }
    return couponIssue;
  }

  async updateCouponIssueUsed(userId: number, couponId: number): Promise<void> {
    const couponIssueData = await this.redis.hgetall(
      `couponIssue:userId:${userId}:couponId:${couponId}`,
    );
    if (couponIssueData.used === 'true')
      throw new Error('쿠폰 사용에 실패했습니다. 이미 사용된 쿠폰입니다.');
    const updatedAt = new Date();
    await this.redis.hset(`couponIssue:userId:${userId}:couponId:${couponId}`, {
      ...couponIssueData,
      used: true,
      updatedAt: updatedAt.toISOString(),
    });
    try {
      await this.prisma.couponIssue.upsert({
        where: {
          userId_couponId: {
            userId,
            couponId,
          },
        },
        update: {
          used: true,
          updatedAt: updatedAt,
        },
        create: {
          userId,
          couponId,
          used: true,
          createdAt: new Date(couponIssueData.createdAt),
          updatedAt: updatedAt,
        },
      });
    } catch (error) {
      console.error('db저장 실패');
    }
  }

  async getIssueCountAndLimit(
    couponId: number,
  ): Promise<{ issued: number; limit: number }> {
    const result = await this.redis.hgetall(`couponLimit:${couponId}`);
    return { issued: Number(result.issued), limit: Number(result.limit) };
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
