import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async login(username: string, password: string) {
    const validatedUser = await this.validateUser(username, password);

    const payload = {
      username: validatedUser.username,
      sub: validatedUser.id,
      role: validatedUser.role,
    };

    const secretForRefreshToken = this.getRefreshSecret();

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: secretForRefreshToken,
    });

    await this.usersService.updateRefreshToken(validatedUser.id, refreshToken);
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async signUp(
    username: string,
    password: string,
    role: string,
  ): Promise<{
    id: string;
    role: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const newUser = await this.usersService.create({ username, password, role });

    return {
      id: newUser.id,
      role: newUser.role,
      username: newUser.username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  async refreshAccessToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new Error('Invalide user');
    }

    const secretForRefreshToken = this.getRefreshSecret();

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: secretForRefreshToken,
      });

      if (payload.sub !== userId) {
        throw new Error('Invalid refresh token');
      }
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isTokenValid) {
      throw new Error('Invalid refresh token');
    }

    const newPayload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(newPayload),
    };
  }

  private getRefreshSecret() {
    return this.configService.get<string>('jwt.jwtSecret') + '_refresh';
  }
}
