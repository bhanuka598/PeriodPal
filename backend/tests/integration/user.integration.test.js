const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('./setup');
const User = require('../../src/models/User');

describe('User API Integration Tests', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeEach(async () => {
    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
      role: 'beneficiary',
      location: 'Colombo'
    });
    userId = user._id;

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin@1234',
      role: 'admin',
      location: 'Colombo'
    });
    adminId = admin._id;

    // Get user token
    const userLoginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'Test@1234'
      });
    userToken = userLoginResponse.body.token;

    // Get admin token
    const adminLoginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@1234'
      });
    adminToken = adminLoginResponse.body.token;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });
  });

  describe('PUT /api/users/profile/:id', () => {
    it('should update user profile with valid token', async () => {
      const updateData = {
        location: 'Kandy',
        avatar: 'https://example.com/avatar.jpg'
      };

      const response = await request(app)
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.location).toBe(updateData.location);
      expect(response.body.avatar).toBe(updateData.avatar);
      expect(response.body).toHaveProperty('token');

      // Verify in database
      const user = await User.findById(userId);
      expect(user.location).toBe(updateData.location);
      expect(user.avatar).toBe(updateData.avatar);
    });

    it('should update password with correct current password', async () => {
      const updateData = {
        currentPassword: 'Test@1234',
        newPassword: 'NewPass@1234'
      };

      const response = await request(app)
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('token');

      // Verify password changed
      const user = await User.findById(userId);
      const isMatch = await user.matchPassword('NewPass@1234');
      expect(isMatch).toBe(true);
    });

    it('should fail to update password with incorrect current password', async () => {
      const updateData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPass@1234'
      };

      const response = await request(app)
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should fail to update without token', async () => {
      const response = await request(app)
        .put(`/api/users/profile/${userId}`)
        .send({ location: 'Kandy' })
        .expect(401);
    });
  });

  describe('GET /api/users (Admin)', () => {
    it('should get all users with admin token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should fail to get all users with regular user token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail to get all users without token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('PUT /api/users/:id (Admin)', () => {
    let otherUserId;

    beforeEach(async () => {
      // Create another user for admin to update
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Other@1234',
        role: 'beneficiary',
        location: 'Galle'
      });
      otherUserId = otherUser._id;
    });

    it('should update user by admin', async () => {
      const updateData = {
        username: 'UpdatedUser',
        role: 'donor',
        location: 'Jaffna',
        eligibleForSupport: true,
        isVerified: true
      };

      const response = await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.username).toBe(updateData.username);
      expect(response.body.role).toBe(updateData.role);
      expect(response.body.location).toBe(updateData.location);
      expect(response.body.eligibleForSupport).toBe(updateData.eligibleForSupport);
      expect(response.body.isVerified).toBe(updateData.isVerified);

      // Verify in database
      const user = await User.findById(otherUserId);
      expect(user.username).toBe(updateData.username);
      expect(user.role).toBe(updateData.role);
    });

    it('should fail to update user with regular user token', async () => {
      const response = await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });

    it('should fail to update non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'Updated' })
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should fail to update without token', async () => {
      const response = await request(app)
        .put(`/api/users/${otherUserId}`)
        .send({ username: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/users/:id (Admin)', () => {
    let otherUserId;

    beforeEach(async () => {
      // Create another user for admin to delete
      const otherUser = await User.create({
        username: 'deletableuser',
        email: 'deletable@example.com',
        password: 'Delete@1234',
        role: 'beneficiary',
        location: 'Matara'
      });
      otherUserId = otherUser._id;
    });

    it('should delete user by admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');
      expect(response.body.deletedUser).toHaveProperty('_id');

      // Verify deletion
      const user = await User.findById(otherUserId);
      expect(user).toBeNull();
    });

    it('should fail to delete user with regular user token', async () => {
      const response = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should fail to delete non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should fail to delete without token', async () => {
      const response = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .expect(401);
    });
  });

  describe('User Profile Integration Flow', () => {
    it('should complete user profile flow: register -> get profile -> update profile', async () => {
      // Step 1: Register (already done in beforeEach)
      // Step 2: Get profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profileResponse.body.username).toBe('testuser');

      // Step 3: Update profile
      const updateResponse = await request(app)
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Anuradhapura',
          avatar: 'https://example.com/newavatar.jpg'
        })
        .expect(200);

      expect(updateResponse.body.location).toBe('Anuradhapura');
      expect(updateResponse.body.avatar).toBe('https://example.com/newavatar.jpg');

      // Verify final state
      const finalProfileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalProfileResponse.body.location).toBe('Anuradhapura');
    });
  });
});
