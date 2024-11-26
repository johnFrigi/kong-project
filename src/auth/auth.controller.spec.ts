import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/users.entity';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = () => ({
  signUp: jest.fn(),
  login: jest.fn(),
  refreshAccessToken: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('getAdminResource', () => {
    it('should return a restricted admin resource message', () => {
      const req = {
        user: {
          id: 'user-123',
          username: 'admin',
          role: 'admin',
        } as User,
      };

      const result = controller.getAdminResource(req);
      expect(result).toEqual('This route is restricted to admin users only.');
    });
  });

  describe('signUp', () => {
    it('should create a new user and return user details', async () => {
      const body = {
        username: 'newuser',
        password: 'newpassword',
        role: 'user',
      };
      const mockUserResponse = {
        id: 'user-123',
        username: body.username,
        role: body.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.signUp!.mockResolvedValue(mockUserResponse);

      const result = await controller.signUp(body);

      expect(authService.signUp).toHaveBeenCalledWith(body.username, body.password, body.role);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const body = {
        username: 'testuser',
        password: 'testpassword',
      };
      const mockLoginResponse = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };

      authService.login!.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(body);

      expect(authService.login).toHaveBeenCalledWith(body.username, body.password);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw UnauthorizedException if login fails', async () => {
      const body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      authService.login!.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(body)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh the access token', async () => {
      const body = {
        userId: 'user-123',
        refreshToken: 'validRefreshToken',
      };
      const mockRefreshResponse = {
        access_token: 'newAccessToken',
      };

      authService.refreshAccessToken!.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refreshAccessToken(body);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith(body.userId, body.refreshToken);
      expect(result).toEqual(mockRefreshResponse);
    });

    it('should throw an error if refresh token is invalid', async () => {
      const body = {
        userId: 'user-123',
        refreshToken: 'invalidRefreshToken',
      };

      authService.refreshAccessToken!.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(controller.refreshAccessToken(body)).rejects.toThrow('Invalid refresh token');
    });
  });
});
