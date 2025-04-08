export class UserPoint {
  id: number;
  point: number;
}

/**
 * 포인트 트랜잭션 종류
 * - CHARGE : 충전
 * - USE : 사용
 */
export enum TransactionType {
  CHARGE,
  USE,
}

export class PointHistory {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  createdAt: number;
}
