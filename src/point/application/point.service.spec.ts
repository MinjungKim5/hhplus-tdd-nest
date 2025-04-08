import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './application/point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { TransactionType } from './domain/point.model';

describe('PointService', () => {
  let service: PointService;
  let pointTable: UserPointTable;
  let pointHistory: PointHistoryTable;

  const mockPointTable = {
    selectById: jest.fn(),
    insertOrUpdate: jest.fn(),
  };

  const mockPointHistory = {
    selectAllByUserId: jest.fn(),
    insert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: UserPointTable,
          useValue: mockPointTable,
        },
        {
          provide: PointHistoryTable,
          useValue: mockPointHistory,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    pointTable = module.get<UserPointTable>(UserPointTable);
    pointHistory = module.get<PointHistoryTable>(PointHistoryTable);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPointByUser', () => {
    it('정상적인 유저가 있을 경우 포인트를 조회할 수 있다.', async () => {
      const mockUserPoint = { userId: 1, point: 1000 };
      mockPointTable.selectById.mockResolvedValue(mockUserPoint);

      const result = await service.getPointByUser(1);

      expect(result).toEqual(mockUserPoint);
      expect(mockPointTable.selectById).toHaveBeenCalledWith(1);
    });

    it('유저가 없을 경우 오류가 발생한다.', async () => {
      mockPointTable.selectById.mockResolvedValue(null);

      await expect(service.getPointByUser(1)).rejects.toThrow(
        '조회 결과가 없습니다.',
      );
    });
  });

  describe('getPointHistoryByUser', () => {
    it('포인트 내역이 있을 경우 포인트 내역을 조회할 수 있다.', async () => {
      const mockHistory = [
        {
          userId: 1,
          amount: 1000,
          type: TransactionType.CHARGE,
          updateMillis: Date.now(),
        },
      ];
      mockPointHistory.selectAllByUserId.mockResolvedValue(mockHistory);

      const result = await service.getPointHistoryByUser(1);

      expect(result).toEqual(mockHistory);
      expect(mockPointHistory.selectAllByUserId).toHaveBeenCalledWith(1);
    });

    it('포인트 내역이 없을 경우 오류가 발생한다.', async () => {
      mockPointHistory.selectAllByUserId.mockResolvedValue([]);

      await expect(service.getPointHistoryByUser(1)).rejects.toThrow(
        '포인트 적립/사용 내역이 없습니다.',
      );
    });
  });

  describe('chargePoint', () => {
    it('정상적인 포인트 충전이 가능하다.', async () => {
      const mockCurrentPoint = { userId: 1, point: 9000 };
      const mockUpdatedPoint = {
        userId: 1,
        point: 10000,
        updateMillis: Date.now(),
      };

      mockPointTable.selectById.mockResolvedValue(mockCurrentPoint);
      mockPointTable.insertOrUpdate.mockResolvedValue(mockUpdatedPoint);

      const result = await service.chargePoint(1, 1000);

      expect(result).toEqual(mockUpdatedPoint);
      expect(mockPointTable.selectById).toHaveBeenCalledWith(1);
      expect(mockPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 10000);
      expect(mockPointHistory.insert).toHaveBeenCalledWith(
        1,
        1000,
        TransactionType.CHARGE,
        mockUpdatedPoint.updateMillis,
      );
    });

    it('충전 한도를 초과할 경우 오류가 발생한다.', async () => {
      const mockCurrentPoint = { userId: 1, point: 9000 };
      mockPointTable.selectById.mockResolvedValue(mockCurrentPoint);

      await expect(service.chargePoint(1, 1001)).rejects.toThrow(
        '충전 한도를 초과했습니다.',
      );
    });
  });

  describe('usePoint', () => {
    it('정상적인 포인트 사용이 가능하다.', async () => {
      const mockCurrentPoint = { userId: 1, point: 1000 };
      const mockUpdatedPoint = {
        userId: 1,
        point: 500,
        updateMillis: Date.now(),
      };

      mockPointTable.selectById.mockResolvedValue(mockCurrentPoint);
      mockPointTable.insertOrUpdate.mockResolvedValue(mockUpdatedPoint);

      const result = await service.usePoint(1, 500);

      expect(result).toEqual(mockUpdatedPoint);
      expect(mockPointTable.selectById).toHaveBeenCalledWith(1);
      expect(mockPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 500);
      expect(mockPointHistory.insert).toHaveBeenCalledWith(
        1,
        500,
        TransactionType.USE,
        mockUpdatedPoint.updateMillis,
      );
    });

    it('정상적인 포인트 사용이 가능하다. 엣지케이스', async () => {
      const mockCurrentPoint = { userId: 1, point: 1000 };
      const mockUpdatedPoint = {
        userId: 1,
        point: 0,
        updateMillis: Date.now(),
      };

      mockPointTable.selectById.mockResolvedValue(mockCurrentPoint);
      mockPointTable.insertOrUpdate.mockResolvedValue(mockUpdatedPoint);

      const result = await service.usePoint(1, 1000);

      expect(result).toEqual(mockUpdatedPoint);
      expect(mockPointTable.selectById).toHaveBeenCalledWith(1);
      expect(mockPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 0);
      expect(mockPointHistory.insert).toHaveBeenCalledWith(
        1,
        1000,
        TransactionType.USE,
        mockUpdatedPoint.updateMillis,
      );
    });

    it('잔액이 부족할 경우 오류가 발생한다.', async () => {
      const mockCurrentPoint = { userId: 1, point: 100 };

      mockPointTable.selectById.mockResolvedValue(mockCurrentPoint);

      await expect(service.usePoint(1, 101)).rejects.toThrow(
        '잔액이 부족합니다.',
      );
    });
  });
});
