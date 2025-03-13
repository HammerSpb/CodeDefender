import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthExceptionFilter } from './filters/auth-exceptions.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OAuthResponse } from './types/oauth-response.type';

@ApiTags('auth')
@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    return this.authService.register(registerDto, req);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refresh successful' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, req);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Body() logoutDto: LogoutDto, @Req() req: Request) {
    // Using non-null assertion since JwtAuthGuard ensures user is defined
    return this.authService.logout(logoutDto.refreshToken, req.user!.id);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'All sessions terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@Req() req: Request) {
    // Using non-null assertion since JwtAuthGuard ensures user is defined
    return this.authService.logoutFromAllDevices(req.user!.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@Req() req: Request) {
    // Using non-null assertion since JwtAuthGuard ensures user is defined
    return this.authService.getUserSessions(req.user!.id);
  }

  // OAuth endpoints
  @Get('oauth/github')
  @ApiOperation({ summary: 'Authenticate with GitHub' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub' })
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('oauth/github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects back to app with tokens' })
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    // The user data is added to req.user by the GitHub strategy
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error`);
    }
    
    // Cast to our expected type after validation
    const userData = req.user as unknown as OAuthResponse;
    
    const frontendUrl = this.getRedirectUrl(req);
    
    // Create URL with auth data
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.append('accessToken', userData.accessToken);
    redirectUrl.searchParams.append('refreshToken', userData.refreshToken);
    redirectUrl.searchParams.append('userId', userData.user.id);
    redirectUrl.searchParams.append('isNewUser', userData.isNewUser ? 'true' : 'false');

    // Redirect back to frontend with tokens
    return res.redirect(redirectUrl.toString());
  }

  /**
   * Get the redirect URL from the request or use default
   */
  private getRedirectUrl(req: Request): string {
    // Try to get from cookie
    const redirectUrl = req.cookies?.['redirectUrl'];
    
    // Alternatively check query param
    const queryRedirect = req.query?.redirectUrl as string;
    
    // Use environment variable as fallback
    const defaultRedirect = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return redirectUrl || queryRedirect || defaultRedirect;
  }
}
