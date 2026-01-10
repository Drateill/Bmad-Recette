import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (service) {
      await service.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to database on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should log success message on successful connection', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith('Database connection established');
    });

    it('should throw error and log when connection fails', async () => {
      const error = new Error('Connection failed');
      const errorSpy = jest.spyOn(service['logger'], 'error');
      jest.spyOn(service, '$connect').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(errorSpy).toHaveBeenCalledWith('Failed to connect to database', error);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should log success message on disconnect', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(logSpy).toHaveBeenCalledWith('Database connection closed');
    });
  });

  describe('lifecycle', () => {
    it('should handle full connection lifecycle', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(connectSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
