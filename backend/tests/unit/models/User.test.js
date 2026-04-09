const User = require('../../../src/models/User');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  describe('Valid User Creation', () => {
    it('should create a user with email and password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.password).not.toBe('password123'); // Should be hashed
      expect(user.role).toBe('beneficiary');
      expect(user.isVerified).toBe(false);
      expect(user.eligibleForSupport).toBe(false);
    });

    it('should create a Google OAuth user without password', async () => {
      const userData = {
        email: 'google@example.com',
        googleId: 'google123'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.googleId).toBe('google123');
      expect(user.password).toBeUndefined();
    });

    it('should create users with different roles', async () => {
      const roles = ['beneficiary', 'admin', 'ngo', 'donor', 'healthOfficer'];

      for (const role of roles) {
        const user = await User.create({
          username: `${role}user`,
          email: `${role}@example.com`,
          password: 'password123',
          role
        });

        expect(user.role).toBe(role);
      }
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'hashtest@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'update@example.com',
        password: 'password123'
      });

      const originalHash = user.password;

      user.username = 'updatedname';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly match valid password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'match@example.com',
        password: 'password123'
      });

      const isMatch = await user.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'nomatch@example.com',
        password: 'password123'
      });

      const isMatch = await user.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should convert email to lowercase', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'password123'
      });

      expect(user.email).toBe('uppercase@example.com');
    });

    it('should trim email whitespace', async () => {
      const user = await User.create({
        username: 'testuser',
        email: '  spaced@example.com  ',
        password: 'password123'
      });

      expect(user.email).toBe('spaced@example.com');
    });

    it('should enforce unique email constraint', async () => {
      await User.create({
        username: 'user1',
        email: 'unique@example.com',
        password: 'password123'
      });

      await expect(
        User.create({
          username: 'user2',
          email: 'unique@example.com',
          password: 'password123'
        })
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        User.create({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })
      ).rejects.toThrow();
    });
  });

  describe('Required Fields', () => {
    it('should require email', async () => {
      await expect(
        User.create({
          username: 'testuser',
          password: 'password123'
        })
      ).rejects.toThrow();
    });

    it('should require username for non-Google users', async () => {
      await expect(
        User.create({
          email: 'nouser@example.com',
          password: 'password123'
        })
      ).rejects.toThrow();
    });

    it('should require password for non-Google users', async () => {
      await expect(
        User.create({
          username: 'testuser',
          email: 'nopass@example.com'
        })
      ).rejects.toThrow();
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude password from JSON output', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'json@example.com',
        password: 'password123'
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.email).toBe('json@example.com');
    });
  });

  describe('Optional Fields', () => {
    it('should store location', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'location@example.com',
        password: 'password123',
        location: 'New York, USA'
      });

      expect(user.location).toBe('New York, USA');
    });

    it('should store avatar URL', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'avatar@example.com',
        password: 'password123',
        avatar: 'https://example.com/avatar.jpg'
      });

      expect(user.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should track support eligibility', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'support@example.com',
        password: 'password123',
        eligibleForSupport: true
      });

      expect(user.eligibleForSupport).toBe(true);
    });
  });
});
