import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { Auth } from '../guards/auth/auth.decorator';
import { AuthService } from './auth.service';
import { User } from '../users/users.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth('admin')
  @Get('admin')
  getAdminResource(@Request() req: { user: User }): string {
    return `This route is restricted to admin users only.`;
  }

  @Post('signup')
  async signUp(@Body() body: { username: string; password: string; role: string }) {
    return this.authService.signUp(body.username, body.password, body.role);
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post('refresh-token')
  async refreshAccessToken(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshAccessToken(body.userId, body.refreshToken);
  }
}
