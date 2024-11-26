import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource, FindOneOptions } from 'typeorm';
import { Service } from './services.entity';
import { Version } from '../versions/versions.entity';
import { CreateServiceDto } from './dtos/create-service.dto';
import { User } from '../users/users.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async createService({
    createServiceDto,
    createdByUserId,
  }: {
    createServiceDto: CreateServiceDto;
    createdByUserId: string;
  }): Promise<Service> {
    const { name, description, version } = createServiceDto;

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const createdBy = await this.userRepository.findOne({ where: { id: createdByUserId } });
      if (!createdBy) {
        throw new Error('User not found');
      }

      const service = this.serviceRepository.create({ name, description, createdBy });
      const savedService = await transactionalEntityManager.save(service);

      const newVersion = this.versionRepository.create({
        name: version,
        service: savedService,
      });
      await transactionalEntityManager.save(newVersion);

      return plainToInstance(Service, service);
    });
  }

  async getAllServices({
    search,
    page,
    limit,
    includeVersions,
    sortBy = 'createdAt',
    sortDirection = 'asc',
  }: {
    search?: string;
    page: number;
    limit: number;
    includeVersions: boolean;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortDirection?: 'asc' | 'desc';
  }) {
    const whereCondition = search
      ? [{ name: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }]
      : {};

    const relations = includeVersions ? ['versions'] : [];

    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const order: FindOneOptions<Service>['order'] = validSortFields.includes(sortBy)
      ? { [sortBy]: sortDirection.toUpperCase() }
      : { createdAt: 'ASC' };

    const [services, total] = await this.serviceRepository.findAndCount({
      where: whereCondition,
      relations,
      take: limit,
      skip: (page - 1) * limit,
      order: order,
    });

    const transformedServices = plainToInstance(Service, services);

    return {
      services: transformedServices,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getServiceById({
    id,
    includeVersions = false,
  }: {
    id: string;
    includeVersions?: boolean;
  }): Promise<Service> {
    const relations = includeVersions ? ['versions'] : [];

    const service = await this.serviceRepository.findOne({
      where: { id },
      relations,
    });

    if (!service) {
      return null;
    }

    return plainToInstance(Service, service);
  }

  async updateService({
    serviceId,
    updateData,
  }: {
    serviceId: string;
    updateData: {
      name?: string;
      description?: string;
      versionsToAdd?: string[];
      versionsToRemove?: string[];
    };
  }): Promise<Service | null> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['versions'],
    });

    if (!service) {
      return null;
    }

    if (updateData.name) {
      service.name = updateData.name;
    }

    if (updateData.description !== undefined) {
      service.description = updateData.description;
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      if (updateData.versionsToAdd) {
        for (const versionName of updateData.versionsToAdd) {
          const newVersion = this.versionRepository.create({
            name: versionName,
            service,
          });

          await transactionalEntityManager.save(newVersion);
        }
      }

      if (updateData.versionsToRemove) {
        for (const versionId of updateData.versionsToRemove) {
          await transactionalEntityManager.delete(Version, {
            id: versionId,
            service: { id: serviceId },
          });
        }
      }
    });

    return this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['versions'],
    });
  }
}
