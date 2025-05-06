import { Module } from '@nestjs/common';
import { UserLock } from './infrastructure/user.lock';

@Module({
  providers: [UserLock],
  exports: [UserLock],
})
export class UserModule {}
