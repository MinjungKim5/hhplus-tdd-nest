import { Module } from '@nestjs/common';
import { PointController } from './controller/point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './application/point.service';
import {
  PointRepository,
  PointRepositoryToken,
} from './infrastructure/point.repository.impl';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [
    PointService,
    { provide: PointRepositoryToken, useClass: PointRepository },
  ],
})
export class PointModule {}
