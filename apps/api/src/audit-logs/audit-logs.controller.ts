import { Controller, Get, Query, UseGuards, Request, Param, Post } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types/user.types';
import { AuditAction, AuditResource } from './entities/audit-log.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post('test-data')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async createTestData(@Request() req) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const createdLogs: any[] = [];
    
    try {
      // Create test user logs
      const userLog1 = await this.auditLogsService.logUserAction(
        AuditAction.CREATE,
        999,
        userId,
        organizationId,
        'Test user creation log',
        { testData: true }
      );
      createdLogs.push(userLog1);

      const userLog2 = await this.auditLogsService.logUserAction(
        AuditAction.UPDATE,
        999,
        userId,
        organizationId,
        'Test user update log',
        { testData: true }
      );
      createdLogs.push(userLog2);

      // Create test organization logs
      const orgLog1 = await this.auditLogsService.logOrganizationAction(
        AuditAction.CREATE,
        organizationId,
        userId,
        'Test organization creation log',
        { testData: true }
      );
      createdLogs.push(orgLog1);

      const orgLog2 = await this.auditLogsService.logOrganizationAction(
        AuditAction.UPDATE,
        organizationId,
        userId,
        'Test organization update log',
        { testData: true }
      );
      createdLogs.push(orgLog2);
    } catch (error) {
      console.error('Failed to create test logs:', error);
    }

    return {
      message: 'Test audit logs created',
      created: createdLogs.length,
      logs: createdLogs
    };
  }

  @Get('organization')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getOrganizationLogs(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const organizationId = req.user.organizationId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return await this.auditLogsService.findByOrganization(
      organizationId,
      pageNum,
      limitNum,
    );
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getUserLogs(
    @Request() req,
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const organizationId = req.user.organizationId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return await this.auditLogsService.findByUser(
      parseInt(userId, 10),
      organizationId,
      pageNum,
      limitNum,
    );
  }

  @Get('resource/:resource/:resourceId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getResourceLogs(
    @Request() req,
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
  ) {
    const organizationId = req.user.organizationId;
    return await this.auditLogsService.findByResource(
      resource as any,
      parseInt(resourceId, 10),
      organizationId,
    );
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getRecentActivity(
    @Request() req,
    @Query('days') days: string = '7',
  ) {
    const organizationId = req.user.organizationId;
    const daysNum = parseInt(days, 10);

    return await this.auditLogsService.getRecentActivity(
      organizationId,
      daysNum,
    );
  }

  @Get('my-activity')
  async getMyActivity(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const { id: userId, organizationId } = req.user;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return await this.auditLogsService.findByUser(
      userId,
      organizationId,
      pageNum,
      limitNum,
    );
  }
}
