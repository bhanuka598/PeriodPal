const menstrualRecordController = require('../../../src/controllers/menstrualRecordController');
const MenstrualRecord = require('../../../src/models/MenstrualRecord');

jest.mock('../../../src/models/MenstrualRecord');
jest.mock('../../../src/utils/emailService', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test123' })
}));

describe('MenstrualRecord Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createRecord', () => {
    it('should create a record with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      req.body = {
        lastPeriodDate: tomorrow.toISOString(),
        cycleLength: 28,
        flowIntensity: 'Medium',
        symptoms: ['Cramps'],
        notes: 'Test note'
      };

      const mockRecord = {
        _id: '123',
        ...req.body,
        symptoms: ['Cramps']
      };

      MenstrualRecord.create.mockResolvedValue(mockRecord);

      await menstrualRecordController.createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockRecord);
      expect(MenstrualRecord.create).toHaveBeenCalledWith(expect.objectContaining({
        cycleLength: 28,
        flowIntensity: 'Medium'
      }));
    });

    it('should return 400 if lastPeriodDate is missing', async () => {
      req.body = { cycleLength: 28 };

      await menstrualRecordController.createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'lastPeriodDate and cycleLength are required'
      });
    });

    it('should return 400 if cycleLength is missing', async () => {
      req.body = { lastPeriodDate: new Date().toISOString() };

      await menstrualRecordController.createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'lastPeriodDate and cycleLength are required'
      });
    });

    it('should return 400 if date is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      req.body = {
        lastPeriodDate: yesterday.toISOString(),
        cycleLength: 28
      };

      await menstrualRecordController.createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Start date cannot be in the past'
      });
    });

    it('should handle server errors', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      req.body = {
        lastPeriodDate: tomorrow.toISOString(),
        cycleLength: 28
      };

      MenstrualRecord.create.mockRejectedValue(new Error('Database error'));

      await menstrualRecordController.createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });

  describe('getAllRecords', () => {
    it('should return all records sorted by creation date', async () => {
      const mockRecords = [
        { _id: '1', cycleLength: 28 },
        { _id: '2', cycleLength: 30 }
      ];

      MenstrualRecord.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRecords)
      });

      await menstrualRecordController.getAllRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRecords);
    });

    it('should handle server errors', async () => {
      MenstrualRecord.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await menstrualRecordController.getAllRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRecordById', () => {
    it('should return a record by valid ID', async () => {
      const mockRecord = { _id: '507f1f77bcf86cd799439011', cycleLength: 28 };
      req.params = { id: '507f1f77bcf86cd799439011' };

      MenstrualRecord.findById.mockResolvedValue(mockRecord);

      await menstrualRecordController.getRecordById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRecord);
    });

    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'invalid-id' };

      await menstrualRecordController.getRecordById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid record id' });
    });

    it('should return 404 if record not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      MenstrualRecord.findById.mockResolvedValue(null);

      await menstrualRecordController.getRecordById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Record not found' });
    });
  });

  describe('updateRecord', () => {
    it('should update a record with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockRecord = {
        _id: '507f1f77bcf86cd799439011',
        cycleLength: 28,
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          cycleLength: 30,
          flowIntensity: 'Heavy'
        })
      };

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {
        cycleLength: 30,
        flowIntensity: 'Heavy',
        lastPeriodDate: tomorrow.toISOString()
      };

      MenstrualRecord.findById.mockResolvedValue(mockRecord);

      await menstrualRecordController.updateRecord(req, res);

      expect(mockRecord.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'invalid-id' };

      await menstrualRecordController.updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid record id' });
    });

    it('should return 404 if record not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      MenstrualRecord.findById.mockResolvedValue(null);

      await menstrualRecordController.updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject update with past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockRecord = {
        _id: '507f1f77bcf86cd799439011',
        cycleLength: 28,
        save: jest.fn()
      };

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { lastPeriodDate: yesterday.toISOString() };

      MenstrualRecord.findById.mockResolvedValue(mockRecord);

      await menstrualRecordController.updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Start date cannot be in the past' });
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record successfully', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439011',
        cycleLength: 28
      };

      req.params = { id: '507f1f77bcf86cd799439011' };

      MenstrualRecord.findById.mockResolvedValue(mockRecord);
      MenstrualRecord.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

      await menstrualRecordController.deleteRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Record deleted' });
    });

    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'invalid-id' };

      await menstrualRecordController.deleteRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if record not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      MenstrualRecord.findById.mockResolvedValue(null);

      await menstrualRecordController.deleteRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllRecordsAdmin', () => {
    it('should return records with analytics', async () => {
      const mockRecords = [
        { _id: '1', cycleLength: 28 },
        { _id: '2', cycleLength: 20 },
        { _id: '3', cycleLength: 40 }
      ];

      MenstrualRecord.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRecords)
      });

      await menstrualRecordController.getAllRecordsAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        records: mockRecords,
        analytics: {
          totalRecords: 3,
          averageCycleLength: 29,
          irregularCycles: 2
        },
        pagination: {
          total: 3,
          page: 1,
          pages: 1
        }
      }));
    });

    it('should handle empty records', async () => {
      MenstrualRecord.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await menstrualRecordController.getAllRecordsAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        analytics: {
          totalRecords: 0,
          averageCycleLength: 0,
          irregularCycles: 0
        }
      }));
    });
  });
});
