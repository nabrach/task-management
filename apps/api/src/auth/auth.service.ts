import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthPayloadDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { UserRole } from '../common/types/user.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private auditLogsService: AuditLogsService
    ) {}

    async validateUser({email, password}: AuthPayloadDto) {
        console.log('Validating user:', email);
        
        const findUser = await this.userRepository.findOne({ where: { email } });
        console.log('validateUser - Raw user from database:', findUser);
        console.log('validateUser - user organizationId:', findUser?.organizationId);
        console.log('validateUser - user organizationId type:', typeof findUser?.organizationId);
        console.log('validateUser - user keys:', Object.keys(findUser || {}));
        
        if (!findUser) {
            console.log('User not found:', email);
            throw new UnauthorizedException('User not found');
        }
        
        console.log('User found, checking password...');
        
        // Compare the provided password with the hashed password in database
        const isPasswordValid = await bcrypt.compare(password, findUser.password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            throw new UnauthorizedException('Invalid password');
        }
        
        console.log('Password valid for user:', email);
        
        // Return user data without password (for strategy validation)
        const {password: _, ...user} = findUser;
        console.log('validateUser - returning user object:', user);
        console.log('validateUser - returning user organizationId:', user.organizationId);
        return user;
    }

    async login(user: any) {
        // Generate JWT token for the validated user
        console.log('AuthService login - received user object:', user);
        console.log('AuthService login - user organizationId:', user.organizationId);
        console.log('AuthService login - user organizationId type:', typeof user.organizationId);
        console.log('AuthService login - user keys:', Object.keys(user));
        
        const payload = {
            sub: user.email,
            email: user.email,
            user: user
        };
        console.log('Creating JWT with payload:', payload);
        console.log('JWT payload user organizationId:', payload.user.organizationId);
        
        const token = this.jwtService.sign(payload);
        console.log('JWT token created successfully');
        return token;
    }

    async createInitialUsers() {
        console.log('Checking for existing users...');
        // Check if users already exist
        const existingUsers = await this.userRepository.count();
        console.log('Existing users count:', existingUsers);
        
        if (existingUsers > 0) {
            console.log('Users already exist, skipping initial user creation');
            return;
        }

        // Create initial test users
        const users = [
            {
                email: 'owner@test.com',
                password: '123456',
                firstName: 'Owner',
                lastName: 'User',
                role: UserRole.OWNER,
                organizationId: undefined
            },
            {
                email: 'admin@test.com',
                password: '123456',
                firstName: 'Admin',
                lastName: 'User',
                role: UserRole.ADMIN,
                organizationId: undefined
            },
            {
                email: 'viewer@test.com',
                password: '123456',
                firstName: 'Viewer',
                lastName: 'User',
                role: UserRole.VIEWER,
                organizationId: undefined
            }
        ];

        for (const userData of users) {
            console.log('Creating user:', userData.email);
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = this.userRepository.create({
                email: userData.email,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                organizationId: userData.organizationId
            });
            const savedUser = await this.userRepository.save(user);
            console.log('User created successfully:', savedUser.email);
            
            // Log the user creation
            try {
                await this.auditLogsService.logUserAction(
                    AuditAction.CREATE,
                    savedUser.id,
                    savedUser.id, // The user is creating themselves
                    savedUser.organizationId || 1,
                    `Initial user "${savedUser.email}" created with role ${savedUser.role}`,
                    { user: savedUser }
                );
            } catch (error) {
                console.error('Failed to log initial user creation:', error);
            }
        }

        console.log('Initial users created successfully');
    }

    async registerUser(registerDto: any) {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ 
            where: { email: registerDto.email } 
        });
        
        if (existingUser) {
            throw new UnauthorizedException('User with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Create and save the user
        const user = this.userRepository.create({
            email: registerDto.email,
            password: hashedPassword,
            firstName: registerDto.firstName || null,
            lastName: registerDto.lastName || null,
            role: registerDto.role || UserRole.VIEWER,
            organizationId: registerDto.organizationId || undefined
        });

        const savedUser = await this.userRepository.save(user);

        // Return user data without password
        const { password, ...userWithoutPassword } = savedUser;

        // Log the user creation
        try {
            await this.auditLogsService.logUserAction(
                AuditAction.CREATE,
                savedUser.id,
                savedUser.id, // The user is creating themselves
                savedUser.organizationId || 1,
                `User "${savedUser.email}" registered with role ${savedUser.role}`,
                { user: userWithoutPassword }
            );
        } catch (error) {
            console.error('Failed to log user registration:', error);
        }

        return userWithoutPassword;
    }
}
