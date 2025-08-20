import { Controller, Get, Param, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }

  @Get('organization/:id')
  async findByOrganization(@Param('id') id: string) {
    this.logger.log(`Fetching users for organization: ${id}`);
    return await this.usersService.findByOrganization(+id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching user with ID: ${id}`);
    return await this.usersService.findOne(+id);
  }
}
