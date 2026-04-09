const OTP = require('../../../src/models/OTP');

describe('OTP Model', () => {
  describe('Valid OTP Creation', () => {
    it('should create OTP with all required fields', async () => {
      const otpData = {
        email: 'test@example.com',
        otp: '123456',
        purpose: 'registration'
      };

      const otp = await OTP.create(otpData);

      expect(otp).toBeDefined();
      expect(otp.email).toBe('test@example.com');
      expect(otp.otp).toBe('123456');
      expect(otp.purpose).toBe('registration');
      expect(otp.verified).toBe(false);
      expect(otp.createdAt).toBeInstanceOf(Date);
    });

    it('should create OTP with default purpose', async () => {
      const otp = await OTP.create({
        email: 'test@example.com',
        otp: '654321'
      });

      expect(otp.purpose).toBe('registration');
    });

    it('should accept all valid purpose values', async () => {
      const purposes = ['registration', 'password_reset', 'email_change'];

      for (const purpose of purposes) {
        const otp = await OTP.create({
          email: `${purpose}@example.com`,
          otp: '123456',
          purpose
        });
        expect(otp.purpose).toBe(purpose);
      }
    });
  });

  describe('Email Validation', () => {
    it('should require email', async () => {
      await expect(OTP.create({
        otp: '123456'
      })).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const otp = await OTP.create({
        email: 'UPPERCASE@EXAMPLE.COM',
        otp: '123456'
      });

      expect(otp.email).toBe('uppercase@example.com');
    });

    it('should trim email whitespace', async () => {
      const otp = await OTP.create({
        email: '  spaced@example.com  ',
        otp: '123456'
      });

      expect(otp.email).toBe('spaced@example.com');
    });
  });

  describe('OTP Validation', () => {
    it('should require otp field', async () => {
      await expect(OTP.create({
        email: 'test@example.com'
      })).rejects.toThrow();
    });
  });

  describe('Verified Field', () => {
    it('should default verified to false', async () => {
      const otp = await OTP.create({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(otp.verified).toBe(false);
    });

    it('should allow setting verified to true', async () => {
      const otp = await OTP.create({
        email: 'test@example.com',
        otp: '123456',
        verified: true
      });

      expect(otp.verified).toBe(true);
    });

    it('should update verified status', async () => {
      const otp = await OTP.create({
        email: 'test@example.com',
        otp: '123456'
      });

      otp.verified = true;
      const updated = await otp.save();

      expect(updated.verified).toBe(true);
    });
  });

  describe('Database Operations', () => {
    it('should find OTP by email', async () => {
      await OTP.create({
        email: 'find@example.com',
        otp: '111111'
      });

      const found = await OTP.findOne({ email: 'find@example.com' });

      expect(found).toBeDefined();
      expect(found.otp).toBe('111111');
    });

    it('should find OTP by email and purpose', async () => {
      await OTP.create({
        email: 'multi@example.com',
        otp: '222222',
        purpose: 'registration'
      });

      await OTP.create({
        email: 'multi@example.com',
        otp: '333333',
        purpose: 'password_reset'
      });

      const found = await OTP.findOne({
        email: 'multi@example.com',
        purpose: 'password_reset'
      });

      expect(found).toBeDefined();
      expect(found.otp).toBe('333333');
    });

    it('should find verified OTP', async () => {
      await OTP.create({
        email: 'verified@example.com',
        otp: '444444',
        verified: true
      });

      const found = await OTP.findOne({
        email: 'verified@example.com',
        verified: true
      });

      expect(found).toBeDefined();
    });

    it('should delete OTP after use', async () => {
      const otp = await OTP.create({
        email: 'delete@example.com',
        otp: '555555'
      });

      await OTP.deleteOne({ _id: otp._id });

      const found = await OTP.findById(otp._id);
      expect(found).toBeNull();
    });

    it('should delete all OTPs for an email', async () => {
      await OTP.create({ email: 'cleanup@example.com', otp: '111111' });
      await OTP.create({ email: 'cleanup@example.com', otp: '222222' });
      await OTP.create({ email: 'cleanup@example.com', otp: '333333' });

      await OTP.deleteMany({ email: 'cleanup@example.com' });

      const remaining = await OTP.find({ email: 'cleanup@example.com' });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Multiple OTPs for Same Email', () => {
    it('should allow multiple unverified OTPs for same email', async () => {
      const otp1 = await OTP.create({
        email: 'multiple@example.com',
        otp: '111111'
      });

      const otp2 = await OTP.create({
        email: 'multiple@example.com',
        otp: '222222'
      });

      expect(otp1._id).not.toEqual(otp2._id);

      const all = await OTP.find({ email: 'multiple@example.com' });
      expect(all).toHaveLength(2);
    });
  });
});
