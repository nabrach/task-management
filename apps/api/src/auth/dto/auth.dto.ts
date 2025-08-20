import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class AuthPayloadDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}