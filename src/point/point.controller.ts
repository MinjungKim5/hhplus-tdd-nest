import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointBody, PointResDto } from './point.dto';
import { PointService } from './point.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { GetUserParamDto } from 'src/user/user.dto';

@Controller('/point')
export class PointController {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
    private readonly pointService: PointService,
  ) {}

  /**
   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
   */
  @Get(':userId')
  @ApiOperation({ summary: '유저의 포인트 조회' })
  @ApiParam({ name: 'userId', type: 'number' })
  async point(@Param() params: GetUserParamDto): Promise<PointResDto> {
    return { point: 1000 };
    return await this.pointService.getPointByUser(params.userId);
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(':userId/histories')
  async history(@Param() params: GetUserParamDto): Promise<PointHistory[]> {
    return await this.pointService.getPointHistoryByUser(params.userId);
  }

  /**
   * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
   */
  @Patch('charge')
  @ApiOperation({ summary: '유저의 포인트 충전' })
  async charge(@Body() pointDto: PointBody): Promise<UserPoint> {
    const { userId, amount } = pointDto;
    return;
    return await this.pointService.chargePoint(userId, amount);
  }

  /**
   * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
   */
  @Patch(':id/use')
  async use(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointBody,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    return this.pointService.usePoint(userId, amount);
  }
}
