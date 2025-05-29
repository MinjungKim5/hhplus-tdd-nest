import { Global, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka.service';
import { ClientKafka } from '@nestjs/microservices';

@Global()
@Module({
  providers: [
    KafkaProducerService,
    {
      provide: 'KAFKA_CONSUMER_FACTORY',
      useFactory: () => {
        return (groupId: string) => {
          return new ClientKafka({
            client: {
              clientId: 'hhplus',
              brokers: ['localhost:9092'],
            },
          });
        };
      },
    },
  ],
  exports: [KafkaProducerService, 'KAFKA_CONSUMER_FACTORY'],
})
export class KafkaModule {}
