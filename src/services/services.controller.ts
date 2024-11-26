import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Request,
  HttpStatus,
  Patch,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dtos/create-service.dto';
import { Auth } from '../guards/auth/auth.decorator';
import { User } from '../users/users.entity';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ServiceResponseDto } from './dtos/service-response.dto';
import { UpdateServiceDto } from './dtos/update-service.dto';

@Controller('api/v1/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The service has been successfully created.',
    type: ServiceResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'New Service',
        createdById: '3926f6e4-dcad-4598-9bae-b1c914184f73',
        description: 'A description of the new service',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Only admin role can create a service.',
  })
  async createService(@Body() createServiceDto: CreateServiceDto, @Request() req: { user: User }) {
    const createdService = await this.servicesService.createService({
      createServiceDto,
      createdByUserId: req.user.id,
    });
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Service successfully created',
      data: { ...createdService },
    };
  }

  @Auth()
  @Get()
  @ApiOperation({ summary: 'Get all services with optional pagination, search, and sorting' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for services',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit per page for pagination',
    example: 10,
  })
  @ApiQuery({
    name: 'includeVersions',
    required: false,
    type: Boolean,
    description: 'Whether to include versions for the service',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (name, createdAt, updatedAt)',
    example: 'name',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    type: String,
    description: 'Sort direction (asc or desc)',
    example: 'asc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of services retrieved successfully.',
    schema: {
      example: {
        services: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Service A',
            createdById: '3926f6e4-dcad-4598-9bae-b1c914184f73',
            description: 'A description of Service A',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  async getAllServices(
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('includeVersions') includeVersions: boolean = false,
    @Query('sortBy') sortBy: 'name' | 'createdAt' | 'updatedAt' = 'createdAt',
    @Query('sortDirection') sortDirection: 'asc' | 'desc' = 'asc',
  ) {
    const services = await this.servicesService.getAllServices({
      search,
      page,
      limit,
      includeVersions,
      sortBy,
      sortDirection,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Services retrieved successfully',
      data: services,
    };
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a specific service by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeVersions',
    required: false,
    type: Boolean,
    description: 'Whether to include versions for the service',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully.',
    type: ServiceResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Service A',
        description: 'A description of Service A',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdById: '3926f6e4-dcad-4598-9bae-b1c914184f73',
        versions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'v1.0.0',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found.',
    schema: {
      example: {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Service not found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  async getServiceById(
    @Param('id') id: string,
    @Query('includeVersions') includeVersions: boolean = false,
  ) {
    const service = await this.servicesService.getServiceById({ id, includeVersions });
    if (!service) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Service not found',
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Service retrieved successfully',
      data: service,
    };
  }

  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service (name, description, add or remove versions)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the service to be updated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The service has been successfully updated.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Service updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Service Name',
          description: 'Updated Service Description',
          versions: [
            {
              id: 'version-1',
              name: 'v1.1.0',
            },
          ],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Service name cannot be an empty ',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found.',
    schema: {
      example: {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Service not found',
      },
    },
  })
  async updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    if ((body.name !== undefined && body.name.trim() === '') || body.name === null) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Service name cannot be empty.',
      });
    }

    const updatedService = await this.servicesService.updateService({
      serviceId: id,
      updateData: {
        name: body.name,
        description: body.description,
        versionsToAdd: body.versionsToAdd,
        versionsToRemove: body.versionsToRemove,
      },
    });

    if (!updatedService) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Service not found',
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Service updated successfully',
      data: updatedService,
    };
  }
}
