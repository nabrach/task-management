import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const organization = this.organizationsRepository.create(createOrganizationDto);
    return await this.organizationsRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return await this.organizationsRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    return organization;
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);
    Object.assign(organization, updateOrganizationDto);
    return await this.organizationsRepository.save(organization);
  }

  async remove(id: number): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationsRepository.remove(organization);
  }

  async createInitialOrganization() {
    console.log('Checking for existing organizations...');
    const existingOrganizations = await this.organizationsRepository.count();
    console.log('Existing organizations count:', existingOrganizations);
    
    if (existingOrganizations > 0) {
      console.log('Organizations already exist, skipping initial organization creation');
      return;
    }

    // Create initial test organization
    const organization = this.organizationsRepository.create({
      name: 'Test Organization',
      description: 'A test organization for development purposes'
    });
    
    const savedOrganization = await this.organizationsRepository.save(organization);
    console.log('Initial organization created successfully:', savedOrganization.name);
  }
}
