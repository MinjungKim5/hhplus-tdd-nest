import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserParamDto {
  @Type(() => Number)
  @IsInt()
  userId: number;
}
