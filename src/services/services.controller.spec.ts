import { plainToInstance } from 'class-transformer';
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dtos/create-service.dto';
import { ServiceResponseDto } from './dtos/service-response.dto';
import { User } from '../users/users.entity';
import { Version } from '../versions/versions.entity';
import { HttpStatus } from '@nestjs/common';
import { Service } from './services.entity';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: jest.Mocked<Partial<ServicesService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useFactory: () => ({
            createService: jest.fn(),
            getAllServices: jest.fn(),
            getServiceById: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    servicesService = module.get(ServicesService);
  });

  describe('createService', () => {
    it('should create a new service and return response', async () => {
      const req = { user: { id: 'user-1234' } as User };
      const createServiceDto: CreateServiceDto = {
        name: 'New Service',
        description: 'Service Description',
        version: '1.0.0',
      };
      const createdService = {
        id: 'service-1234',
        name: createServiceDto.name,
        description: createServiceDto.description,
        createdById: req.user.id,
        createdBy: req.user,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };
      servicesService.createService!.mockResolvedValue(createdService);

      const result = await controller.createService(createServiceDto, req);

      expect(servicesService.createService).toHaveBeenCalledWith({
        createServiceDto,
        createdByUserId: req.user.id,
      });
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Service successfully created',
        data: { createdService },
      });
    });
  });

  describe('getAllServices', () => {
    it('should return a list of services', async () => {
      const query = {
        search: 'Test',
        page: 1,
        limit: 10,
        includeVersions: true,
      };
      const mockServices = [
        {
          id: 'service-1234',
          name: 'Service A',
          description: 'Service Description',
          createdById: 'user-1234',
          createdBy: { id: 'user-1234' } as User,
          createdAt: new Date(),
          updatedAt: new Date(),
          versions: [],
        },
      ];
      const servicesResponse = {
        services: mockServices,
        total: 1,
        currentPage: query.page,
        totalPages: 1,
      };
      servicesService.getAllServices!.mockResolvedValue(servicesResponse);

      const result = await controller.getAllServices(
        query.search,
        query.page,
        query.limit,
        query.includeVersions,
      );

      expect(servicesService.getAllServices).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Services retrieved successfully',
        data: servicesResponse,
      });
    });
  });

  describe('getServiceById', () => {
    it('should return a service by ID', async () => {
      const paramId = 'service-1234';
      const queryIncludeVersions = true;

      const mockService = {
        id: paramId,
        name: 'Service A',
        description: 'Service Description',
        createdById: 'user-1234',
        createdBy: { id: 'user-1234' } as User,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: 'version-1',
            name: '1.0.0',
            service: { id: paramId } as Service,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Version,
        ],
      };

      servicesService.getServiceById!.mockResolvedValue(mockService);

      const transformedService = plainToInstance(ServiceResponseDto, mockService);

      const result = await controller.getServiceById(paramId, queryIncludeVersions);

      expect(servicesService.getServiceById).toHaveBeenCalledWith({
        id: paramId,
        includeVersions: queryIncludeVersions,
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Service retrieved successfully',
        data: transformedService,
      });
    });

    it('should return not found if the service does not exist', async () => {
      const paramId = 'invalid-service-id';
      const queryIncludeVersions = false;

      servicesService.getServiceById!.mockResolvedValue(null);

      const result = await controller.getServiceById(paramId, queryIncludeVersions);

      expect(servicesService.getServiceById).toHaveBeenCalledWith({
        id: paramId,
        includeVersions: queryIncludeVersions,
      });
      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Service not found',
      });
    });
  });
});
