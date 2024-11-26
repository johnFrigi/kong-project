import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Version } from '../versions/versions.entity';
import { User } from '../users/users.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 256 })
  name: string;

  @Column({ length: 256, nullable: true })
  description?: string;

  @OneToMany(() => Version, (version) => version.service)
  versions: Version[];

  @Exclude()
  @ManyToOne(() => User, { nullable: false })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
