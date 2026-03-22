import { ApiProperty } from '@nestjs/swagger';

export enum UserRoleDto {
  RETAILER = 'retailer',
  SUPPLIER = 'supplier',
}

export class SignupEmailDto {
  @ApiProperty({ example: 'retailer@shop.com' })
  email!: string;

  @ApiProperty({ example: 'Retail Partner One' })
  fullName!: string;

  @ApiProperty({ enum: UserRoleDto, example: UserRoleDto.RETAILER })
  role!: UserRoleDto;

  @ApiProperty({ example: 'StrongPassword!123' })
  password!: string;
}

export class LoginEmailDto {
  @ApiProperty({ example: 'retailer@shop.com' })
  email!: string;

  @ApiProperty({ example: 'StrongPassword!123' })
  password!: string;
}

export class SignupGoogleDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...google-id-token...',
    description: 'Google ID token from frontend OAuth flow',
  })
  idToken!: string;

  @ApiProperty({ enum: UserRoleDto, example: UserRoleDto.SUPPLIER })
  role!: UserRoleDto;
}

export class LoginGoogleDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...google-id-token...',
    description: 'Google ID token from frontend OAuth flow',
  })
  idToken!: string;
}
