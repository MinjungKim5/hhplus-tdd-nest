export class UserPoint {
  point: number;
}

export type TransactionType = 'charge' | 'use';
export class PointHistory {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  createdAt: Date;
}
