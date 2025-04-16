import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../../src/point/application/point.service';
import { IPointRepository } from '../../src/point/domain/point.repository';
import { PointRepositoryToken } from '../../src/point/infrastructure/point.repository.impl';
import { TransactionType } from '../../src/point/domain/point';

describe('PointService', () => {
  let service: PointService;
  let pointRepository: jest.Mocked<IPointRepository>;

  const mockPointRepository = {
    getPointByUser: jest.fn(),
    getPointHistory: jest.fn(),
    updatePointBalance: jest.fn(),
    createPointHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: PointRepositoryToken,
          useValue: mockPointRepository,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    pointRepository = module.get(PointRepositoryToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPointByUser', () => {
    it('정상적인 유저가 있을 경우 포인트를 조회할 수 있다.', async () => {
      const mockPoint = 1000;
      pointRepository.getPointByUser.mockResolvedValue(mockPoint);

      const result = await service.getPointByUser(1);

      expect(result).toEqual(mockPoint);
      expect(pointRepository.getPointByUser).toHaveBeenCalledWith(1);
    });

    it('유저가 없을 경우 오류가 발생한다.', async () => {
      pointRepository.getPointByUser.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.getPointByUser(1)).rejects.toThrow('User not found');
    });
  });

  describe('getPointHistoryByUser', () => {
    it('포인트 내역이 있을 경우 포인트 내역을 조회할 수 있다.', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: 1,
          type: 'charge' as TransactionType,
          amount: 1000,
          createdAt: new Date(),
        },
      ];
      pointRepository.getPointHistory.mockResolvedValue(mockHistory);

      const result = await service.getPointHistoryByUser(1);

      expect(result).toEqual(
        mockHistory.map((history) => ({
          id: history.id,
          amount: history.amount,
          type: history.type,
          createdAt: history.createdAt,
        })),
      );
      expect(pointRepository.getPointHistory).toHaveBeenCalledWith(1);
    });

    it('포인트 내역이 없을 경우 빈 배열을 반환한다.', async () => {
      pointRepository.getPointHistory.mockResolvedValue([]);

      const result = await service.getPointHistoryByUser(1);

      expect(result).toEqual([]);
      expect(pointRepository.getPointHistory).toHaveBeenCalledWith(1);
    });
  });

  describe('chargePoint', () => {
    it('정상적인 포인트 충전이 가능하다.', async () => {
      pointRepository.getPointByUser.mockResolvedValue(9000);
      pointRepository.updatePointBalance.mockResolvedValue({ point: 10000 });
      pointRepository.createPointHistory.mockResolvedValue(true);

      const result = await service.chargePoint(1, 1000);

      expect(result).toEqual({ point: 10000 });
      expect(pointRepository.getPointByUser).toHaveBeenCalledWith(1);
      expect(pointRepository.updatePointBalance).toHaveBeenCalledWith(1, 10000);
      expect(pointRepository.createPointHistory).toHaveBeenCalledWith({
        userId: 1,
        amount: 1000,
        type: 'charge',
      });
    });

    it('충전 한도를 초과할 경우 오류가 발생한다.', async () => {
      pointRepository.getPointByUser.mockResolvedValue(9500);

      await expect(service.chargePoint(1, 600)).rejects.toThrow(
        '충전 한도를 초과했습니다.',
      );
    });
  });

  describe('usePoint', () => {
    it('정상적인 포인트 사용이 가능하다.', async () => {
      pointRepository.getPointByUser.mockResolvedValue(1000);
      pointRepository.updatePointBalance.mockResolvedValue({ point: 500 });
      pointRepository.createPointHistory.mockResolvedValue(true);

      const result = await service.usePoint(1, 500);

      expect(result).toEqual({ point: 500 });
      expect(pointRepository.getPointByUser).toHaveBeenCalledWith(1);
      expect(pointRepository.updatePointBalance).toHaveBeenCalledWith(1, 500);
      expect(pointRepository.createPointHistory).toHaveBeenCalledWith({
        userId: 1,
        amount: 500,
        type: 'use',
      });
    });

    it('잔액이 부족할 경우 오류가 발생한다.', async () => {
      pointRepository.getPointByUser.mockResolvedValue(100);

      await expect(service.usePoint(1, 200)).rejects.toThrow(
        '잔액이 부족합니다.',
      );
    });
  });
});
