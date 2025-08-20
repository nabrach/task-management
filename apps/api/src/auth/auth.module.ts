import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { envConfig } from '../config/env.config';
import { User } from './entities/user.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    AuditLogsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy]
})
export class AuthModule implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    console.log('JWT_SECRET being used:', envConfig.JWT_SECRET);
    
    // Create initial users if they don't exist
    try {
      await this.authService.createInitialUsers();
    } catch (error) {
      console.error('Failed to create initial users:', error);
    }
  }
}
