import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class VersionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'The unique identifier of the version',
  })
  id: string;

  @ApiProperty({ example: 'v1.0.0', description: 'The version name' })
  name: string;
}

export class ServiceResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the service',
  })
  id: string;

  @ApiProperty({ example: 'New Service', description: 'The name of the service' })
  name: string;

  @ApiPropertyOptional({
    example: 'A description of the new service',
    description: 'A brief description of the service',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    example: '3926f6e4-dcad-4598-9bae-b1c914184f73',
    description: 'The unique identifier of the user who created this service',
  })
  createdById: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'The timestamp when the service was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'The timestamp when the service was last updated',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [VersionResponseDto],
    description: 'The list of versions for the service',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'v1.0.0',
      },
    ],
    nullable: true,
  })
  versions?: VersionResponseDto[];
}
