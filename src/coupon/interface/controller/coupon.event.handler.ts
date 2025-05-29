import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  ClientKafka,
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { CouponService } from 'src/coupon/application/coupon.service';

@Injectable()
export class CouponKafkaConsumer implements OnModuleInit {
  constructor(
    @Inject('COUPON_KAFKA') private readonly kafka: ClientKafka,
    private readonly couponService: CouponService,
  ) {}

  async onModuleInit() {
    this.kafka.subscribeToResponseOf('coupon.claim');
    await this.kafka.connect();
  }

  @MessagePattern('coupon.claim')
  async handleCouponClaim(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const { userId, couponId } = message;
    const kafkaMessage = JSON.parse(
      context.getMessage().value.toString('utf-8'),
    );

    try {
      await this.couponService.claimCouponWithTransaction(userId, couponId);
    } catch (error) {
      console.error('처리 실패:', error);

      // DLQ로 메시지 전송
      await this.sendToDLQ(kafkaMessage, error);
    } finally {
      await this.commitOffset(context, kafkaMessage);
    }
  }

  private async sendToDLQ(message: any, error: Error) {
    const dlqMessage = {
      originalMessage: message,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    };

    await this.kafka.emit('coupon.claim.dlq', dlqMessage);
  }

  private async commitOffset(context: KafkaContext, kafkaMessage: any) {
    const consumer = context.getConsumer();
    await consumer.commitOffsets([
      {
        topic: context.getTopic(),
        partition: kafkaMessage.partition,
        offset: (Number(kafkaMessage.offset) + 1).toString(),
      },
    ]);
  }
}
