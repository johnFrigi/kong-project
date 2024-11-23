import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Name of the service', example: 'New Service' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A description of the new service',
    example: 'A description of the new service',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Initial version of the service', example: 'Version 1.0' })
  @IsString()
  @IsNotEmpty()
  version: string;
}
