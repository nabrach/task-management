import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: '../../tasks.sqlite', // Path to the SQLite file in the root directory
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Be careful with this in production
      logging: true,
    }),
    TasksModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
