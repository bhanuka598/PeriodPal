const request = require('supertest');
const { app } = require('./setup');
const User = require('../../src/models/User');

describe('Auth API Integration Tests', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Colombo'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('token');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe(userData.role);

      // Verify user was saved to database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
    });

    it('should fail to register with missing required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
        // Missing password, role, location
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Please provide all required fields');
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalidemail',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Colombo'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('valid email');
    });

    it('should fail to register with weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        role: 'beneficiary',
        location: 'Colombo'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password validation failed');
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Colombo'
      };

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toContain('already registered');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Colombo'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test@1234'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(loginData.email);
      expect(response.body.username).toBe('testuser');
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test@1234'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should handle case-insensitive email', async () => {
      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Test@1234'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create a test user and get token
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Colombo'
      });
      userId = user._id;

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      authToken = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.username).toBe('testuser');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to get current user without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail to get current user with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('Auth Flow Integration', () => {
    it('should complete full auth flow: register -> login -> get profile', async () => {
      // Step 1: Register
      const registerData = {
        username: 'flowuser',
        email: 'flow@example.com',
        password: 'Test@1234',
        role: 'beneficiary',
        location: 'Kandy'
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: registerData.email,
          password: registerData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      const token = loginResponse.body.token;

      // Step 3: Get profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(registerData.email);
      expect(profileResponse.body.username).toBe(registerData.username);
    });
  });
});
