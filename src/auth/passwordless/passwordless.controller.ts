import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PasswordlessService } from './passwordless.service';
import { MagicLinkDto } from '../dto/magic-link.dto';
import { VerifyMagicLinkDto } from '../dto/verify-magic-link.dto';

@ApiTags('passwordless')
@Controller('auth/passwordless')
export class PasswordlessController {
  constructor(private readonly passwordlessService: PasswordlessService) {}

  @Post('email/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a magic link for passwordless authentication' })
  @ApiResponse({ status: 200, description: 'Magic link sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestMagicLink(@Body() magicLinkDto: MagicLinkDto, @Req() req: Request) {
    const token = await this.passwordlessService.createMagicLink(magicLinkDto.email, req.ip);
    
    // Send the magic link via email
    await this.passwordlessService.sendMagicLinkEmail(magicLinkDto.email, token);
    
    return {
      message: 'Magic link sent to your email',
      email: magicLinkDto.email,
    };
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a magic link and authenticate' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired magic link' })
  async verifyMagicLink(@Body() verifyDto: VerifyMagicLinkDto, @Req() req: Request) {
    return this.passwordlessService.verifyMagicLink(verifyDto.token, req);
  }
}
