const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('./setup');
const MenstrualRecord = require('../../src/models/MenstrualRecord');

describe('Menstrual Record API Integration Tests', () => {
  describe('POST /api/records', () => {
    it('should create a menstrual record successfully', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const recordData = {
        lastPeriodDate: tomorrow.toISOString(),
        cycleLength: 28,
        flowIntensity: 'Medium',
        symptoms: ['Cramps', 'Headache'],
        notes: 'Feeling normal'
      };

      const response = await request(app)
        .post('/api/records')
        .send(recordData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.lastPeriodDate).toBeTruthy();
      expect(response.body.cycleLength).toBe(recordData.cycleLength);
      expect(response.body.flowIntensity).toBe(recordData.flowIntensity);
      expect(response.body.symptoms).toEqual(recordData.symptoms);
      expect(response.body.notes).toBe(recordData.notes);

      // Verify in database
      const record = await MenstrualRecord.findOne({ cycleLength: 28 });
      expect(record).toBeTruthy();
      expect(record.cycleLength).toBe(28);
    });

    it('should fail to create record with missing required fields', async () => {
      const recordData = {
        flowIntensity: 'Medium'
        // Missing lastPeriodDate and cycleLength
      };

      const response = await request(app)
        .post('/api/records')
        .send(recordData)
        .expect(400);

      expect(response.body.message).toContain('lastPeriodDate and cycleLength are required');
    });

    it('should fail to create record with past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recordData = {
        lastPeriodDate: yesterday.toISOString(),
        cycleLength: 28
      };

      const response = await request(app)
        .post('/api/records')
        .send(recordData)
        .expect(400);

      expect(response.body.message).toContain('Start date cannot be in the past');
    });

    it('should fail to create record with invalid flow intensity', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const recordData = {
        lastPeriodDate: tomorrow.toISOString(),
        cycleLength: 28,
        flowIntensity: 'Invalid'
      };

      const response = await request(app)
        .post('/api/records')
        .send(recordData)
        .expect(500);
    });
  });

  describe('GET /api/records', () => {
    beforeEach(async () => {
      const today = new Date();
      const date1 = new Date(today);
      date1.setDate(date1.getDate() + 1);
      const date2 = new Date(today);
      date2.setDate(date2.getDate() + 2);

      await MenstrualRecord.create([
        {
          lastPeriodDate: date1,
          cycleLength: 28,
          flowIntensity: 'Medium',
          symptoms: ['Cramps']
        },
        {
          lastPeriodDate: date2,
          cycleLength: 30,
          flowIntensity: 'Heavy',
          symptoms: ['Headache', 'Bloating']
        }
      ]);
    });

    it('should get all records', async () => {
      const response = await request(app)
        .get('/api/records')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array when no records exist', async () => {
      await MenstrualRecord.deleteMany({});

      const response = await request(app)
        .get('/api/records')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/records/:id', () => {
    let recordId;

    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        flowIntensity: 'Light',
        symptoms: ['Fatigue']
      });
      recordId = record._id;
    });

    it('should get record by valid ID', async () => {
      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body._id).toBe(recordId.toString());
      expect(response.body.cycleLength).toBe(28);
    });

    it('should fail with invalid record ID', async () => {
      const response = await request(app)
        .get('/api/records/invalidid')
        .expect(400);

      expect(response.body.message).toContain('Invalid record id');
    });

    it('should fail with non-existent record ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/records/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('Record not found');
    });
  });

  describe('PUT /api/records/:id', () => {
    let recordId;

    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        flowIntensity: 'Medium',
        symptoms: ['Cramps']
      });
      recordId = record._id;
    });

    it('should update record successfully', async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const updateData = {
        cycleLength: 30,
        flowIntensity: 'Heavy',
        symptoms: ['Headache', 'Bloating'],
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.cycleLength).toBe(updateData.cycleLength);
      expect(response.body.flowIntensity).toBe(updateData.flowIntensity);
      expect(response.body.symptoms).toEqual(updateData.symptoms);
      expect(response.body.notes).toBe(updateData.notes);

      // Verify in database
      const record = await MenstrualRecord.findById(recordId);
      expect(record.cycleLength).toBe(updateData.cycleLength);
    });

    it('should fail to update with past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .send({ lastPeriodDate: yesterday.toISOString() })
        .expect(400);

      expect(response.body.message).toContain('Start date cannot be in the past');
    });

    it('should fail with invalid record ID', async () => {
      const response = await request(app)
        .put('/api/records/invalidid')
        .send({ cycleLength: 30 })
        .expect(400);

      expect(response.body.message).toContain('Invalid record id');
    });

    it('should fail with non-existent record ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/records/${nonExistentId}`)
        .send({ cycleLength: 30 })
        .expect(404);

      expect(response.body.message).toContain('Record not found');
    });

    it('should handle partial updates', async () => {
      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .send({ notes: 'Only updating notes' })
        .expect(200);

      expect(response.body.notes).toBe('Only updating notes');
      expect(response.body.cycleLength).toBe(28); // Unchanged
    });
  });

  describe('DELETE /api/records/:id', () => {
    let recordId;

    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        flowIntensity: 'Medium'
      });
      recordId = record._id;
    });

    it('should delete record successfully', async () => {
      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .expect(200);

      expect(response.body.message).toContain('Record deleted');

      // Verify deletion
      const record = await MenstrualRecord.findById(recordId);
      expect(record).toBeNull();
    });

    it('should fail with invalid record ID', async () => {
      const response = await request(app)
        .delete('/api/records/invalidid')
        .expect(400);

      expect(response.body.message).toContain('Invalid record id');
    });

    it('should fail with non-existent record ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/records/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('Record not found');
    });
  });

  describe('POST /api/records/:id/send-email', () => {
    let recordId;

    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        flowIntensity: 'Medium'
      });
      recordId = record._id;
    });

    it('should fail without email configuration', async () => {
      const response = await request(app)
        .post(`/api/records/${recordId}/send-email`)
        .send({ toEmail: 'test@example.com' })
        .expect(500);

      expect(response.body.message).toContain('Email service not configured');
    });

    it('should fail without toEmail', async () => {
      const response = await request(app)
        .post(`/api/records/${recordId}/send-email`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('toEmail is required');
    });

    it('should fail with invalid record ID', async () => {
      const response = await request(app)
        .post('/api/records/invalidid/send-email')
        .send({ toEmail: 'test@example.com' })
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should fail with non-existent record ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/records/${nonExistentId}/send-email`)
        .send({ toEmail: 'test@example.com' })
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });
  });

  describe('GET /api/records/admin/all', () => {
    beforeEach(async () => {
      const today = new Date();
      const date1 = new Date(today);
      date1.setDate(date1.getDate() + 1);
      const date2 = new Date(today);
      date2.setDate(date2.getDate() + 2);
      const date3 = new Date(today);
      date3.setDate(date3.getDate() + 3);

      await MenstrualRecord.create([
        { lastPeriodDate: date1, cycleLength: 28, flowIntensity: 'Medium' },
        { lastPeriodDate: date2, cycleLength: 30, flowIntensity: 'Heavy' },
        { lastPeriodDate: date3, cycleLength: 20, flowIntensity: 'Light' }
      ]);
    });

    it('should get all records with analytics', async () => {
      const response = await request(app)
        .get('/api/records/admin/all')
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('analytics');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records).toHaveLength(3);
      expect(response.body.analytics.totalRecords).toBe(3);
      expect(response.body.analytics.averageCycleLength).toBeGreaterThan(0);
      expect(response.body.analytics.irregularCycles).toBe(1); // 20 is irregular
    });

    it('should handle empty records with analytics', async () => {
      await MenstrualRecord.deleteMany({});

      const response = await request(app)
        .get('/api/records/admin/all')
        .expect(200);

      expect(response.body.analytics.totalRecords).toBe(0);
      expect(response.body.analytics.averageCycleLength).toBe(0);
      expect(response.body.analytics.irregularCycles).toBe(0);
    });
  });

  describe('Menstrual Record Integration Flow', () => {
    it('should complete full record lifecycle: create -> read -> update -> delete', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Step 1: Create
      const createData = {
        lastPeriodDate: tomorrow.toISOString(),
        cycleLength: 28,
        flowIntensity: 'Medium',
        symptoms: ['Cramps'],
        notes: 'Initial record'
      };

      const createResponse = await request(app)
        .post('/api/records')
        .send(createData)
        .expect(201);

      const recordId = createResponse.body._id;

      // Step 2: Read
      const readResponse = await request(app)
        .get(`/api/records/${recordId}`)
        .expect(200);

      expect(readResponse.body.cycleLength).toBe(28);

      // Step 3: Update
      const updateResponse = await request(app)
        .put(`/api/records/${recordId}`)
        .send({ cycleLength: 30, notes: 'Updated record' })
        .expect(200);

      expect(updateResponse.body.cycleLength).toBe(30);
      expect(updateResponse.body.notes).toBe('Updated record');

      // Step 4: Delete
      const deleteResponse = await request(app)
        .delete(`/api/records/${recordId}`)
        .expect(200);

      expect(deleteResponse.body.message).toContain('deleted');

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/records/${recordId}`)
        .expect(404);
    });
  });
});
