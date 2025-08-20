import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule implements OnModuleInit {
  constructor(private readonly organizationsService: OrganizationsService) {}

  async onModuleInit() {
    await this.organizationsService.createInitialOrganization();
  }
}
