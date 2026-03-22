import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  LoginEmailDto,
  LoginGoogleDto,
  SignupEmailDto,
  SignupGoogleDto,
} from './dto/auth.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUserId } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup-email')
  @ApiOperation({
    summary:
      'Create retailer or supplier account with email/password and create Fuji wallet',
  })
  @ApiBody({ type: SignupEmailDto })
  @ApiOkResponse({ type: AuthResponseDto })
  signupEmail(@Body() dto: SignupEmailDto) {
    return this.authService.signupEmail(dto);
  }

  @Post('login-email')
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiBody({ type: LoginEmailDto })
  @ApiOkResponse({ type: AuthResponseDto })
  loginEmail(@Body() dto: LoginEmailDto) {
    return this.authService.loginEmail(dto);
  }

  @Post('signup-google')
  @ApiOperation({
    summary:
      'Create retailer or supplier account with Google login and create Fuji wallet',
  })
  @ApiBody({ type: SignupGoogleDto })
  @ApiOkResponse({ type: AuthResponseDto })
  signupGoogle(@Body() dto: SignupGoogleDto) {
    return this.authService.signupGoogle(dto);
  }

  @Post('login-google')
  @ApiOperation({ summary: 'Login with Google ID token' })
  @ApiBody({ type: LoginGoogleDto })
  @ApiOkResponse({ type: AuthResponseDto })
  loginGoogle(@Body() dto: LoginGoogleDto) {
    return this.authService.loginGoogle(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUserId() userId: string) {
    return this.authService.getProfile(userId);
  }
}
