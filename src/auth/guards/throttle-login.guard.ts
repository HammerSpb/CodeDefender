import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottleLoginGuard extends ThrottlerGuard {
  /**
   * Only apply throttling to login/register endpoints
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the request path
    const request = context.switchToHttp().getRequest();
    const { path } = request.route || {};
    
    // Only throttle login and register endpoints
    const isAuthEndpoint = 
      path === '/api/v1/auth/login' || 
      path === '/api/v1/auth/register';
    
    if (!isAuthEndpoint) {
      return true;
    }
    
    // Use IP address as the tracker
    const ip = request.ip || 
               request.headers['x-forwarded-for'] || 
               'unknown-ip';
    
    // Apply stricter rate limiting for auth endpoints
    request.throttlerTracker = ip;
    
    // Use the parent implementation
    return super.canActivate(context);
  }
}
