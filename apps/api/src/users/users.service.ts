import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByOrganization(organizationId: number): Promise<User[]> {
    return await this.usersRepository.find({
      where: { organizationId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId'], // Exclude password
    });
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId'], // Exclude password
    });
  }

  async findOne(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId'], // Exclude password
    });
  }
}
