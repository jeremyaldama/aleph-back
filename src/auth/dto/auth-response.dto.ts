import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({ example: 'fuji' })
  network!: 'fuji';

  @ApiProperty({ example: 43113 })
  chainId!: number;

  @ApiProperty({ example: 'https://api.avax-test.network/ext/bc/C/rpc' })
  rpcUrl!: string;

  @ApiProperty({ example: '0x8ba1f109551bD432803012645Ac136ddd64DBA72' })
  address!: string;

  @ApiProperty({
    example:
      '0x04f355bdcb7cc0af728ef3cceb9615d90684bb5f0ea7f4f1c0d5f0fd14735f4f83f6d4f2c68f5b26d3f127f4cc13a6b0446dcf8f5e8f138f739b6b4f4d3b6635c4',
  })
  publicKey!: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 'usr-kz6r9n2m' })
  id!: string;

  @ApiProperty({ example: 'retailer@shop.com' })
  email!: string;

  @ApiProperty({ example: 'Retail Partner One' })
  fullName!: string;

  @ApiProperty({ enum: ['retailer', 'supplier'], example: 'retailer' })
  role!: 'retailer' | 'supplier';

  @ApiProperty({ enum: ['email', 'google'], example: 'email' })
  provider!: 'email' | 'google';

  @ApiProperty({ type: () => WalletResponseDto })
  wallet!: WalletResponseDto;

  @ApiProperty({ example: '2026-03-22T12:10:00.000Z' })
  createdAt!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3Ita3o2cjluMm0iLCJlbWFpbCI6InJldGFpbGVyQHNob3AuY29tIiwicm9sZSI6InJldGFpbGVyIiwiaWF0IjoxNzExMTAwMDAwLCJleHAiOjE3MTExMDcyMDB9.signature',
  })
  accessToken!: string;

  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}
