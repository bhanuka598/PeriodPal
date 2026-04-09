const authController = require('../../../src/controllers/authController');
const User = require('../../../src/models/User');
const generateToken = require('../../../src/utils/generateToken');

jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/generateToken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    generateToken.mockReturnValue('mock-token');
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user with valid data', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'beneficiary',
        location: 'New York'
      };

      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'beneficiary'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'beneficiary',
        token: 'mock-token'
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com'
        // missing password, role, location
      };

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please provide all required fields'
      }));
    });

    it('should return 409 if email already exists', async () => {
      req.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'beneficiary',
        location: 'New York'
      };

      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'This email address is already registered.'
      }));
    });

    it('should return 400 for invalid email format', async () => {
      req.body = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!',
        role: 'beneficiary',
        location: 'New York'
      };

      User.findOne.mockResolvedValue(null);

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please enter a valid email address.'
      }));
    });

    it('should validate password requirements', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        role: 'beneficiary',
        location: 'New York'
      };

      User.findOne.mockResolvedValue(null);

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password validation failed',
        errors: expect.arrayContaining([expect.stringContaining('8 characters')])
      }));
    });

    it('should reject password with spaces', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Pass word123!',
        role: 'beneficiary',
        location: 'New York'
      };

      User.findOne.mockResolvedValue(null);

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([expect.stringContaining('spaces')])
      }));
    });
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'beneficiary',
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '123',
        email: 'test@example.com',
        token: 'mock-token'
      }));
    });

    it('should return 401 for invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid email or password'
      }));
    });

    it('should return 401 for non-existent user', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      User.findOne.mockResolvedValue(null);

      await authController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should normalize email (trim and lowercase)', async () => {
      req.body = {
        email: '  Test@Example.COM  ',
        password: 'Password123!'
      };

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
});
