import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/users.entity';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useFactory: () => ({
            findByUsername: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
          }),
        },
        {
          provide: JwtService,
          useFactory: () => ({
            sign: jest.fn(),
            verify: jest.fn(),
          }),
        },
        {
          provide: ConfigService,
          useFactory: () => ({
            get: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('validateUser', () => {
    it('should validate and return the user', async () => {
      const username = 'testuser';
      const password = 'testpassword';
      const mockUser = {
        id: 'user-123',
        username,
        password: 'hashedPassword',
        role: 'user',
      } as User;

      usersService.findByUsername.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(true));

      const result = await service.validateUser(username, password);

      expect(usersService.findByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const username = 'invaliduser';
      const password = 'wrongpassword';

      usersService.findByUsername.mockResolvedValue(undefined);

      await expect(service.validateUser(username, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should log in a user and return tokens', async () => {
      const username = 'testuser';
      const password = 'testpassword';
      const validatedUser = { id: 'user-123', username, role: 'user' };
      const payload = { username, sub: validatedUser.id, role: validatedUser.role };
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      jest.spyOn(service, 'validateUser').mockResolvedValue(validatedUser);
      jest.spyOn(configService, 'get').mockReturnValue('refreshSecret');
      jwtService.sign.mockReturnValueOnce(refreshToken).mockReturnValueOnce(accessToken);

      const result = await service.login(username, password);

      expect(service.validateUser).toHaveBeenCalledWith(username, password);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        expiresIn: '7d',
        secret: 'refreshSecret_refresh',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(validatedUser.id, refreshToken);
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    });
  });

  describe('signUp', () => {
    it('should sign up a new user and return the user data', async () => {
      const username = 'newuser';
      const password = 'newpassword';
      const role = 'user';
      const mockUser = {
        id: 'user-123',
        username,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.create.mockResolvedValue(mockUser as User);

      const result = await service.signUp(username, password, role);

      expect(usersService.create).toHaveBeenCalledWith({ username, password, role });
      expect(result).toEqual({
        id: mockUser.id,
        role: mockUser.role,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh the access token', async () => {
      const userId = 'user-123';
      const refreshToken = 'validRefreshToken';
      const secretForRefreshToken = 'refreshSecret';
      const user = {
        id: userId,
        username: 'testuser',
        role: 'user',
        refreshToken: 'hashedRefreshToken',
      } as User;

      usersService.findById.mockResolvedValue(user);
      jest.spyOn(configService, 'get').mockReturnValue(secretForRefreshToken);
      jwtService.verify.mockReturnValue({ sub: userId });
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(true));

      const newAccessToken = 'newAccessToken';
      jwtService.sign.mockReturnValue(newAccessToken);

      const result = await service.refreshAccessToken(userId, refreshToken);

      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: `${secretForRefreshToken}_refresh`,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(refreshToken, user.refreshToken);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.username,
        sub: user.id,
        role: user.role,
      });
      expect(result).toEqual({ access_token: newAccessToken });
    });

    it('should throw an error if the refresh token is invalid', async () => {
      const userId = 'user-123';
      const refreshToken = 'invalidRefreshToken';
      const secretForRefreshToken = 'refreshSecret';
      const user = {
        id: userId,
        username: 'testuser',
        role: 'user',
        refreshToken: 'hashedRefreshToken',
      } as User;

      usersService.findById.mockResolvedValue(user);
      jest.spyOn(configService, 'get').mockReturnValue(secretForRefreshToken);
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(service.refreshAccessToken(userId, refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
});
