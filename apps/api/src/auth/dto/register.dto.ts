import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../common/types/user.types';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber({}, { message: 'organizationId must be a valid number' })
  organizationId?: number;
}
