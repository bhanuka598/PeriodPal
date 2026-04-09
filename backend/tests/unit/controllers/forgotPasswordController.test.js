const forgotPasswordController = require('../../../src/controllers/forgotPasswordController');
const User = require('../../../src/models/User');
const OTP = require('../../../src/models/OTP');
const { sendOTPEmail } = require('../../../src/services/emailService');

jest.mock('../../../src/models/User');
jest.mock('../../../src/models/OTP');
jest.mock('../../../src/services/emailService');

describe('Forgot Password Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should send OTP for existing user', async () => {
      req.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com'
      };

      User.findOne.mockResolvedValue(mockUser);
      OTP.deleteMany.mockResolvedValue({});
      const mockOTP = {
        _id: 'otp123',
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset'
      };
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockResolvedValue(true);

      await forgotPasswordController.forgotPassword(req, res, next);

      expect(OTP.deleteMany).toHaveBeenCalledWith({
        email: 'test@example.com',
        purpose: 'password_reset'
      });
      expect(OTP.create).toHaveBeenCalled();
      expect(sendOTPEmail).toHaveBeenCalledWith('test@example.com', expect.any(String), 'password_reset');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
    });

    it('should return generic message for non-existent user (security)', async () => {
      req.body = { email: 'nonexistent@example.com' };

      User.findOne.mockResolvedValue(null);

      await forgotPasswordController.forgotPassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
      expect(OTP.create).not.toHaveBeenCalled();
    });

    it('should return 400 if email is missing', async () => {
      req.body = {};

      await forgotPasswordController.forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email is required'
      }));
    });

    it('should normalize email to lowercase', async () => {
      req.body = { email: 'TEST@EXAMPLE.COM' };

      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      OTP.deleteMany.mockResolvedValue({});
      OTP.create.mockResolvedValue({ email: 'test@example.com', otp: '123456' });
      sendOTPEmail.mockResolvedValue(true);

      await forgotPasswordController.forgotPassword(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(OTP.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));
    });

    it('should delete saved OTP if email sending fails', async () => {
      req.body = { email: 'test@example.com' };

      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      OTP.deleteMany.mockResolvedValue({});
      const mockOTP = { _id: 'otp123', email: 'test@example.com' };
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockRejectedValue(new Error('Email failed'));

      await forgotPasswordController.forgotPassword(req, res, next);

      expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: 'otp123' });
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Failed to send reset email. Please try again.'
      }));
    });
  });

  describe('verifyResetOTP', () => {
    it('should verify OTP successfully', async () => {
      req.body = { email: 'test@example.com', otp: '123456' };

      const mockOTP = {
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: false,
        save: jest.fn().mockResolvedValue(true)
      };

      OTP.findOne.mockResolvedValue(mockOTP);

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(mockOTP.verified).toBe(true);
      expect(mockOTP.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP verified successfully',
        email: 'test@example.com'
      });
    });

    it('should return 400 if email is missing', async () => {
      req.body = { otp: '123456' };

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email and OTP are required'
      }));
    });

    it('should return 400 if OTP is missing', async () => {
      req.body = { email: 'test@example.com' };

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email and OTP are required'
      }));
    });

    it('should return 400 for invalid or expired OTP', async () => {
      req.body = { email: 'test@example.com', otp: '000000' };

      OTP.findOne.mockResolvedValue(null);

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid or expired OTP. Please request a new one.'
      }));
    });

    it('should check for unverified OTP only', async () => {
      req.body = { email: 'test@example.com', otp: '123456' };

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(OTP.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: false
      });
    });

    it('should normalize email when verifying', async () => {
      req.body = { email: 'TEST@EXAMPLE.COM', otp: '123456' };

      OTP.findOne.mockResolvedValue(null);

      await forgotPasswordController.verifyResetOTP(req, res, next);

      expect(OTP.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: false
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPass123!'
      };

      const mockOTP = {
        _id: 'otp123',
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: true
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'oldpassword',
        save: jest.fn().mockResolvedValue(true)
      };

      OTP.findOne.mockResolvedValue(mockOTP);
      User.findOne.mockResolvedValue(mockUser);
      OTP.deleteOne.mockResolvedValue({});

      await forgotPasswordController.resetPassword(req, res, next);

      expect(mockUser.password).toBe('NewPass123!');
      expect(mockUser.save).toHaveBeenCalled();
      expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: 'otp123' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully. Please login with your new password.'
      });
    });

    it('should return 400 if email is missing', async () => {
      req.body = { otp: '123456', newPassword: 'NewPass123!' };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email, OTP, and new password are required'
      }));
    });

    it('should return 400 if OTP is missing', async () => {
      req.body = { email: 'test@example.com', newPassword: 'NewPass123!' };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email, OTP, and new password are required'
      }));
    });

    it('should return 400 if newPassword is missing', async () => {
      req.body = { email: 'test@example.com', otp: '123456' };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email, OTP, and new password are required'
      }));
    });

    it('should return 400 for weak password', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'weak'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      }));
    });

    it('should return 400 if OTP not verified', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPass123!'
      };

      OTP.findOne.mockResolvedValue(null);

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'OTP not verified or expired. Please verify again.'
      }));
    });

    it('should return 404 if user not found', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPass123!'
      };

      const mockOTP = {
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: true
      };

      OTP.findOne.mockResolvedValue(mockOTP);
      User.findOne.mockResolvedValue(null);

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found'
      }));
    });

    it('should check for verified OTP with correct purpose', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPass123!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(OTP.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: true
      });
    });

    it('should normalize email when resetting password', async () => {
      req.body = {
        email: 'TEST@EXAMPLE.COM',
        otp: '123456',
        newPassword: 'NewPass123!'
      };

      OTP.findOne.mockResolvedValue(null);

      await forgotPasswordController.resetPassword(req, res, next);

      expect(OTP.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        purpose: 'password_reset',
        verified: true
      });
    });
  });

  describe('Password Strength Validation', () => {
    it('should accept strong password with all requirements', async () => {
      const strongPasswords = [
        'NewPass123!',
        'MyP@ssw0rd',
        'C0mpl3x!Pass',
        'Str0ng#PWD'
      ];

      for (const password of strongPasswords) {
        req.body = {
          email: 'test@example.com',
          otp: '123456',
          newPassword: password
        };

        OTP.findOne.mockResolvedValue({
          email: 'test@example.com',
          otp: '123456',
          purpose: 'password_reset',
          verified: true
        });

        User.findOne.mockResolvedValue({
          email: 'test@example.com',
          save: jest.fn().mockResolvedValue(true)
        });

        OTP.deleteOne.mockResolvedValue({});

        await forgotPasswordController.resetPassword(req, res, next);

        // Should not throw error
        expect(next).not.toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('Password must be at least')
        }));
      }
    });

    it('should reject password without uppercase', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newpass123!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });

    it('should reject password without lowercase', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NEWPASS123!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });

    it('should reject password without number', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPassword!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });

    it('should reject password without special character', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPass123'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });

    it('should reject password with spaces', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'New Pass123!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });

    it('should reject password with repeated characters', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPasss123!'
      };

      await forgotPasswordController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('8 characters')
      }));
    });
  });
});
