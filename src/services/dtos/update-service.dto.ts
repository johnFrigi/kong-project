import { IsOptional, IsString, IsArray, ArrayNotEmpty, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'The new name of the service',
    example: 'Updated Service Name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'The updated description of the service',
    example: 'This is an updated description for the service.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of versions to be added to the service',
    example: ['v1.2.0', 'v1.3.0'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  versionsToAdd?: string[];

  @ApiPropertyOptional({
    description: 'List of version IDs to be removed from the service',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  versionsToRemove?: string[];
}
