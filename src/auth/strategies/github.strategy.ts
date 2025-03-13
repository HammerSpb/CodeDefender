import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { OAuthResponse } from '../types/oauth-response.type';

/**
 * GitHub OAuth authentication strategy
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');
    
    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('GitHub OAuth configuration is incomplete. Please check your environment variables.');
    }
    
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email', 'repo'],
    });
  }

  /**
   * Validate the GitHub profile and create/link user account
   */
  async validate(accessToken: string, refreshToken: string, profile: any): Promise<OAuthResponse> {
    const { id, displayName, emails, username } = profile;
    
    // Find or create user based on GitHub profile
    const user = await this.authService.findOrCreateOAuthUser({
      provider: 'github',
      providerId: id,
      email: emails?.[0]?.value || `${username}@github.noemail`,
      firstName: displayName?.split(' ')[0] || username,
      lastName: displayName?.split(' ').slice(1).join(' ') || '',
      accessToken,
      refreshToken,
    });

    return user;
  }
}
