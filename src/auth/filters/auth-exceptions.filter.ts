import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(UnauthorizedException, ThrottlerException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Get client IP for logging
    const ip = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    let status: number;
    let message: string;
    let error: string;
    
    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Too many failed attempts. Please try again later.';
      error = 'Rate Limit Exceeded';
      
      this.logger.warn(`Rate limit exceeded - IP: ${ip}, User-Agent: ${userAgent}, Path: ${request.path}`);
    } else {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      message = exceptionResponse.message || 'Authentication failed';
      error = exceptionResponse.error || 'Unauthorized';
      
      // Log authentication failures, but without sensitive data
      this.logger.warn(`Authentication failure - IP: ${ip}, User-Agent: ${userAgent}, Path: ${request.path}`);
    }
    
    // Return a standardized error response
    response.status(status).json({
      statusCode: status,
      error: error,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
