import { Module } from '@nestjs/common';
import { PointController } from './controller/point.controller';
import { PointService } from './application/point.service';
import {
  PointRepository,
  PointRepositoryToken,
} from './infrastructure/point.repository.impl';

@Module({
  controllers: [PointController],
  providers: [
    PointService,
    { provide: PointRepositoryToken, useClass: PointRepository },
  ],
})
export class PointModule {}
