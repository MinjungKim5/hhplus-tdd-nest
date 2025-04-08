import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { PointHistory, UserPoint } from '../domain/point';
import { ChargePointReqDto, PointResDto } from './point.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { GetUserParamDto } from '../../user/controller/user.dto';
import { PointService } from '../application/point.service';

@Controller('/point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Get(':userId')
  @ApiOperation({ summary: '유저의 포인트 조회' })
  @ApiParam({ name: 'userId', type: 'number' })
  async point(@Param() params: GetUserParamDto): Promise<PointResDto> {
    const point = await this.pointService.getPointByUser(params.userId);
    return { point };
  }

  @Get(':userId/histories')
  async history(@Param() params: GetUserParamDto): Promise<PointHistory[]> {
    return await this.pointService.getPointHistoryByUser(params.userId);
  }

  @Patch('charge')
  @ApiOperation({ summary: '유저의 포인트 충전' })
  async charge(@Body() pointDto: ChargePointReqDto): Promise<UserPoint> {
    const { userId, amount } = pointDto;
    return await this.pointService.chargePoint(userId, amount);
  }

  /*
  @Patch(':id/use')
  async use(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: ChargePointReqDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    return this.pointService.usePoint(userId, amount);
  }
  */
}
