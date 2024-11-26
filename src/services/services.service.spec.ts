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
  delete: jest.fn(),
});

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn((callback) =>
    callback({
      save: jest.fn(),
      delete: jest.fn(),
    }),
  ),
});

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceRepository: Repository<Service>;
  let userRepository: Repository<User>;
  let versionRepository: Repository<Version>;
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
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
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

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: createdByUserId } as User);

      const createdService = {
        id: 'service-1234',
        name: createServiceDto.name,
        description: createServiceDto.description,
      };

      jest.spyOn(serviceRepository, 'create').mockReturnValue(createdService as Service);

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
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

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
        { id: 'service-1234', name: 'Test Service', description: 'Description' } as Service,
      ];

      jest.spyOn(serviceRepository, 'findAndCount').mockResolvedValue([mockServices, 1]);

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

      jest
        .spyOn(serviceRepository, 'findAndCount')
        .mockResolvedValue([mockServices as Service[], 2]);

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
        } as Service,
      ];

      jest.spyOn(serviceRepository, 'findAndCount').mockResolvedValue([mockServices, 1]);

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

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(mockService as Service);

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

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(mockService as Service);

      const result = await service.getServiceById({ id: serviceId, includeVersions: true });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });
      expect(result).toEqual(mockService);
    });

    it('should return null if the service is not found', async () => {
      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getServiceById({ id: 'invalid-service-id' });

      expect(result).toBeNull();
    });
  });

  describe('updateService', () => {
    it('should update service details successfully', async () => {
      const serviceId = 'service-1234';
      const updateData = {
        name: 'Updated Service Name',
        description: 'Updated Service Description',
      };
      const mockService = {
        id: serviceId,
        name: 'Original Service Name',
        description: 'Original Description',
        versions: [],
      };

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(mockService as Service);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue({ ...mockService, ...updateData }),
        });
      });

      const result = await service.updateService({ serviceId, updateData });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual({ ...mockService, ...updateData });
    });

    it('should add new versions to the service', async () => {
      const serviceId = 'service-1234';
      const updateData = {
        versionsToAdd: ['v1.2.0'],
      };
      const mockService = {
        id: serviceId,
        name: 'Service Name',
        description: 'Service Description',
        versions: [],
      };
      const mockUpdatedValue = {
        ...mockService,
        versions: [{ id: 'version-1', name: 'v1.2.0' }],
      };

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValueOnce(mockService as Service);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockUpdatedValue),
        });
      });
      jest.spyOn(serviceRepository, 'findOne').mockResolvedValueOnce(mockUpdatedValue as Service);

      const result = await service.updateService({ serviceId, updateData });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });

      expect(versionRepository.create).toHaveBeenCalledWith({
        name: 'v1.2.0',
        service: mockService,
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.versions).toEqual([{ id: 'version-1', name: 'v1.2.0' }]);
    });

    it('should remove versions from the service', async () => {
      const serviceId = 'service-1234';
      const updateData = {
        versionsToRemove: ['version-1'],
      };
      const mockService = {
        id: serviceId,
        name: 'Service Name',
        description: 'Service Description',
        versions: [{ id: 'version-1', name: 'v1.0.0' }],
      } as Service;

      const updatedService = {
        ...mockService,
        version: [],
      };

      const deleteSpy = jest.fn();

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(mockService as Service);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          delete: deleteSpy.mockResolvedValue({}),
          save: jest.fn().mockResolvedValue(updatedService),
        });
      });
      jest.spyOn(serviceRepository, 'findOne').mockResolvedValueOnce(updatedService);

      await service.updateService({ serviceId, updateData });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });

      expect(dataSource.transaction).toHaveBeenCalled();

      expect(deleteSpy).toHaveBeenCalledWith(Version, {
        id: 'version-1',
        service: { id: serviceId },
      });
    });

    it('should return null if the service is not found', async () => {
      const serviceId = 'invalid-service-id';
      const updateData = {
        name: 'Updated Service Name',
      };

      jest.spyOn(serviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.updateService({ serviceId, updateData });

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
        relations: ['versions'],
      });
      expect(result).toBeNull();
    });
  });
});
