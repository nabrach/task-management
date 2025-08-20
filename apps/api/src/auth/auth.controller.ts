import { Controller, Post, Body, HttpStatus, HttpException, UseGuards, Get, Req } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            const user = await this.authService.registerUser(registerDto);
            return {
                message: 'User registered successfully',
                user: user
            };
        } catch (error) {
            throw new HttpException(error.message || 'Registration failed', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Req() req: Request) {
        try {
            // The local strategy has already validated the user
            // Now generate a JWT token for the validated user
            const token = await this.authService.login(req.user);
            return {
                access_token: token,
                user: req.user
            };
        } catch (error) {
            throw new HttpException(error.message || 'Invalid credentials', HttpStatus.UNAUTHORIZED);
        }
    }
    @Get('status')
    @UseGuards(JwtAuthGuard)
    status(@Req() req: Request) {
        console.log('inside authcontroller status method')
        console.log('Full user object:', req.user);
        console.log('User type:', typeof req.user);
        console.log('User keys:', Object.keys(req.user || {}));
        
        if (!req.user) {
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
        }
        
        const response = {
            user: req.user,
            message: 'User authenticated successfully'
        };
        console.log('Status endpoint returning:', response);
        return response;
    }
}