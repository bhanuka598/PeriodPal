const otpController = require('../../../src/controllers/otpController');
const OTP = require('../../../src/models/OTP');
const { sendOTPEmail } = require('../../../src/services/emailService');

jest.mock('../../../src/models/OTP');
jest.mock('../../../src/services/emailService');

describe('OTP Controller', () => {
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

  describe('sendOTP', () => {
    it('should send OTP successfully', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      const mockOTP = {
        _id: 'otp123',
        email: 'test@example.com',
        otp: '123456',
        purpose: 'registration'
      };

      OTP.deleteMany.mockResolvedValue({});
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockResolvedValue(true);

      await otpController.sendOTP(req, res, next);

      expect(OTP.deleteMany).toHaveBeenCalledWith({ email: 'test@example.com', purpose: 'registration' });
      expect(OTP.create).toHaveBeenCalled();
      expect(sendOTPEmail).toHaveBeenCalledWith('test@example.com', expect.any(String), 'registration');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'OTP sent successfully to your email'
      }));
    });

    it('should return 400 if email is missing', async () => {
      req.body = { purpose: 'registration' };

      await otpController.sendOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email is required'
      }));
    });

    it('should return 400 for invalid email format', async () => {
      req.body = { email: 'invalid-email', purpose: 'registration' };

      await otpController.sendOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid email format'
      }));
    });

    it('should delete saved OTP if email sending fails', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      const mockOTP = { _id: 'otp123' };
      OTP.deleteMany.mockResolvedValue({});
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockRejectedValue(new Error('Email failed'));

      await otpController.sendOTP(req, res, next);

      expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: 'otp123' });
    });

    it('should normalize email to lowercase', async () => {
      req.body = { email: 'TEST@EXAMPLE.COM', purpose: 'registration' };

      OTP.deleteMany.mockResolvedValue({});
      OTP.create.mockResolvedValue({ email: 'test@example.com', otp: '123456' });
      sendOTPEmail.mockResolvedValue(true);

      await otpController.sendOTP(req, res, next);

      expect(OTP.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      req.body = { email: 'test@example.com', otp: '123456', purpose: 'registration' };

      const mockOTP = {
        email: 'test@example.com',
        otp: '123456',
        purpose: 'registration',
        verified: false,
        save: jest.fn().mockResolvedValue(true)
      };

      OTP.findOne.mockResolvedValue(mockOTP);

      await otpController.verifyOTP(req, res, next);

      expect(mockOTP.verified).toBe(true);
      expect(mockOTP.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Email verified successfully'
      }));
    });

    it('should return 400 if email is missing', async () => {
      req.body = { otp: '123456' };

      await otpController.verifyOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email and OTP are required'
      }));
    });

    it('should return 400 if OTP is missing', async () => {
      req.body = { email: 'test@example.com' };

      await otpController.verifyOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email and OTP are required'
      }));
    });

    it('should return 400 for invalid or expired OTP', async () => {
      req.body = { email: 'test@example.com', otp: '000000', purpose: 'registration' };

      OTP.findOne.mockResolvedValue(null);

      await otpController.verifyOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid or expired OTP. Please request a new one.'
      }));
    });

    it('should normalize email when verifying', async () => {
      req.body = { email: 'TEST@EXAMPLE.COM', otp: '123456', purpose: 'registration' };

      OTP.findOne.mockResolvedValue(null);

      await otpController.verifyOTP(req, res, next);

      expect(OTP.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        purpose: 'registration',
        verified: false
      });
    });
  });

  describe('checkEmailVerified', () => {
    it('should return verified true if email is verified', async () => {
      req.body = { email: 'verified@example.com', purpose: 'registration' };

      OTP.findOne.mockResolvedValue({ email: 'verified@example.com', verified: true });

      await otpController.checkEmailVerified(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        verified: true,
        email: 'verified@example.com'
      });
    });

    it('should return verified false if email is not verified', async () => {
      req.body = { email: 'notverified@example.com', purpose: 'registration' };

      OTP.findOne.mockResolvedValue(null);

      await otpController.checkEmailVerified(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        verified: false,
        email: 'notverified@example.com'
      });
    });

    it('should return 400 if email is missing', async () => {
      req.body = { purpose: 'registration' };

      await otpController.checkEmailVerified(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email is required'
      }));
    });
  });

  describe('resendOTP', () => {
    it('should resend OTP after 60 seconds', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      OTP.findOne.mockResolvedValue(null); // No recent OTP
      OTP.deleteMany.mockResolvedValue({});
      const mockOTP = { _id: 'otp456', email: 'test@example.com', otp: '654321' };
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockResolvedValue(true);

      await otpController.resendOTP(req, res, next);

      expect(OTP.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'New OTP sent successfully'
      }));
    });

    it('should return 429 if requesting OTP within 60 seconds', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      const recentOTP = {
        email: 'test@example.com',
        createdAt: new Date(Date.now() - 30000) // 30 seconds ago
      };
      OTP.findOne.mockResolvedValue(recentOTP);

      await otpController.resendOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please wait 60 seconds before requesting a new OTP'
      }));
    });

    it('should return 400 if email is missing', async () => {
      req.body = { purpose: 'registration' };

      await otpController.resendOTP(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email is required'
      }));
    });

    it('should delete saved OTP if email sending fails', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      OTP.findOne.mockResolvedValue(null);
      OTP.deleteMany.mockResolvedValue({});
      const mockOTP = { _id: 'otp789' };
      OTP.create.mockResolvedValue(mockOTP);
      sendOTPEmail.mockRejectedValue(new Error('Email failed'));

      await otpController.resendOTP(req, res, next);

      expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: 'otp789' });
    });
  });

  describe('generateOTP', () => {
    it('should generate 6-digit OTP', async () => {
      req.body = { email: 'test@example.com', purpose: 'registration' };

      OTP.deleteMany.mockResolvedValue({});
      const createdOTPs = [];
      OTP.create.mockImplementation((data) => {
        createdOTPs.push(data.otp);
        return Promise.resolve(data);
      });
      sendOTPEmail.mockResolvedValue(true);

      await otpController.sendOTP(req, res, next);

      const otp = createdOTPs[0];
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });
});
