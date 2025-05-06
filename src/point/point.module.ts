import { Module } from '@nestjs/common';
import { PointController } from './controller/point.controller';
import { PointService } from './application/point.service';
import {
  PointRepository,
  PointRepositoryToken,
} from './infrastructure/point.repository.impl';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PointController],
  providers: [
    PointService,
    { provide: PointRepositoryToken, useClass: PointRepository },
  ],
})
export class PointModule {}
