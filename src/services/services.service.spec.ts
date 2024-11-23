import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Service } from './services.entity';
import { Version } from '../versions/versions.entity';
import { User } from '../users/users.entity';
import { CreateServiceDto } from './dtos/create-service.dto';

const mockServiceRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
});

const mockVersionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn((callback) =>
    callback({
      save: jest.fn(),
    }),
  ),
});

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceRepository: Repository<Service>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useFactory: mockServiceRepository },
        { provide: getRepositoryToken(Version), useFactory: mockVersionRepository },
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    serviceRepository = module.get<Repository<Service>>(getRepositoryToken(Service));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('createService', () => {
    it('should create a new service successfully', async () => {
      const createServiceDto: CreateServiceDto = {
        name: 'Test Service',
        description: 'Test Description',
        version: '1.0.0',
      };
      const createdByUserId = 'user-1234';

      (userRepository.findOne as jest.Mock).mockResolvedValue({ id: createdByUserId });

      const createdService = {
        id: 'service-1234',
        name: createServiceDto.name,
        description: createServiceDto.description,
      };
      (serviceRepository.create as jest.Mock).mockReturnValue(createdService);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(createdService),
        });
      });

      const result = await service.createService({ createServiceDto, createdByUserId });

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: createdByUserId } });
      expect(serviceRepository.create).toHaveBeenCalledWith({
        name: createServiceDto.name,
        description: createServiceDto.description,
        createdBy: { id: createdByUserId },
      });
      expect(result).toEqual(createdService);
    });

    it('should throw an error if user is not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const createServiceDto: CreateServiceDto = {
        name: 'Test Service',
        description: 'Test Description',
        version: '1.0.0',
      };

      await expect(
        service.createService({ createServiceDto, createdByUserId: 'invalid-user-id' }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('getAllServices', () => {
    it('should return a paginated list of services', async () => {
      const search = 'Test';
      const page = 1;
      const limit = 10;
      const includeVersions = false;

      const mockServices = [
        { id: 'service-1234', name: 'Test Service', description: 'Description' },
      ];
      (serviceRepository.findAndCount as jest.Mock).mockResolvedValue([mockServices, 1]);

      const result = await service.getAllServices({ search, page, limit, includeVersions });

      expect(serviceRepository.findAndCount).toHaveBeenCalledWith({
        where: [{ name: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }],
        relations: [],
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'ASC' },
      });
      expect(result.services).toEqual(mockServices);
      expect(result.total).toEqual(1);
      expect(result.currentPage).toEqual(page);
      expect(result.totalPages).toEqual(1);
    });

    it('should return a sorted list of services by name in ascending order', async () => {
      const sortBy = 'name';
      const sortDirection = 'asc';
      const page = 1;
      const limit = 10;
      const includeVersions = false;

      const mockServices = [
        { id: 'service-1234', name: 'A Service', description: 'Description' },
        { id: 'service-5678', name: 'B Service', description: 'Description' },
      ];
      (serviceRepository.findAndCount as jest.Mock).mockResolvedValue([mockServices, 2]);

      const result = await service.getAllServices({
        search: undefined,
        page,
        limit,
        includeVersions,
        sortBy,
        sortDirection,
      });

      expect(serviceRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: [],
        take: limit,
        skip: (page - 1) * limit,
        order: { name: 'ASC' },
      });
      expect(result.services).toEqual(mockServices);
      expect(result.total).toEqual(2);
    });

    it('should return services including versions when requested', async () => {
      const page = 1;
      const limit = 10;
      const includeVersions = true;

      const mockServices = [
        {
          id: 'service-1234',
          name: 'Test Service',
          description: 'Description',
          versions: [{ id: 'version-1', name: '1.0.0' }],
        },
      ];
      (serviceRepository.findAndCount as jest.Mock).mockResolvedValue([mockServices, 1]);

      const result = await service.getAllServices({ page, limit, includeVersions });

      expect(serviceRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['versions'],
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'ASC' },
      });
      expect(result.services).toEqual(mockServices);
      expect(result.total).toEqual(1);
    });
  });

  describe('getServiceById', () => {
    it('should return a service by ID', async () => {
      const serviceId = 'service-1234';
      const mockService = { id: serviceId, name: 'Test Service', description: 'Test Description' };

      (serviceRepository.findOne as jest.Mock).mockResolvedValue(mockService);

      const result = await service.getServiceById({ id: serviceId, includeVersions: false });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: [],
      });
      expect(result).toEqual(mockService);
    });

    it('should return service including versions when requested', async () => {
      const serviceId = 'service-1234';
      const mockService = { id: serviceId, name: 'Test Service', description: 'Test Description' };

      (serviceRepository.findOne as jest.Mock).mockResolvedValue(mockService);

      const result = await service.getServiceById({ id: serviceId, includeVersions: true });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });
      expect(result).toEqual(mockService);
    });

    it('should return null if the service is not found', async () => {
      (serviceRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getServiceById({ id: 'invalid-service-id' });

      expect(result).toBeNull();
    });
  });
});
