import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('findByUsername', () => {
    it('should find a user by username', async () => {
      const username = 'testuser';
      const mockUser = {
        id: 'user-123',
        username,
        password: 'hashedPassword',
        role: 'user',
      } as User;

      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user is not found', async () => {
      userRepository.findOne!.mockResolvedValue(undefined);

      const result = await service.findByUsername('nonexistentuser');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'user',
      } as User;

      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user is not found', async () => {
      userRepository.findOne!.mockResolvedValue(undefined);

      const result = await service.findById('nonexistentId');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userInput = {
        username: 'newuser',
        password: 'plaintextPassword',
        role: 'user',
      };

      const hashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'genSalt').mockImplementationOnce(() => Promise.resolve('testSalt'));
      jest.spyOn(bcrypt, 'hash').mockImplementationOnce(() => Promise.resolve(hashedPassword));

      const mockUser = {
        id: 'user-123',
        username: userInput.username,
        password: hashedPassword,
        role: userInput.role,
      } as User;

      userRepository.create!.mockReturnValue(mockUser);
      userRepository.save!.mockResolvedValue(mockUser);

      const result = await service.create(userInput);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userInput.password, 'testSalt');
      expect(userRepository.create).toHaveBeenCalledWith({
        username: userInput.username,
        password: hashedPassword,
        role: userInput.role,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateRefreshToken', () => {
    it("should update a user's refresh token with hashed value", async () => {
      const userId = 'user-123';
      const refreshToken = 'newRefreshToken';

      const hashedRefreshToken = 'hashedRefreshToken123';
      jest.spyOn(bcrypt, 'genSalt').mockImplementationOnce(() => Promise.resolve('testSalt'));
      jest.spyOn(bcrypt, 'hash').mockImplementationOnce(() => Promise.resolve(hashedRefreshToken));

      await service.updateRefreshToken(userId, refreshToken);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 'testSalt');
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        refreshToken: hashedRefreshToken,
      });
    });
  });
});
