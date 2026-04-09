const MenstrualRecord = require('../../../src/models/MenstrualRecord');

describe('MenstrualRecord Model', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  describe('Valid Record Creation', () => {
    it('should create a valid menstrual record with all required fields', async () => {
      const recordData = {
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        flowIntensity: 'Medium',
        symptoms: ['Cramps', 'Bloating'],
        notes: 'Test notes'
      };

      const record = await MenstrualRecord.create(recordData);

      expect(record).toBeDefined();
      expect(record.lastPeriodDate).toEqual(recordData.lastPeriodDate);
      expect(record.cycleLength).toBe(28);
      expect(record.flowIntensity).toBe('Medium');
      expect(record.symptoms).toEqual(['Cramps', 'Bloating']);
      expect(record.notes).toBe('Test notes');
      expect(record._id).toBeDefined();
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
    });

    it('should create a record with default values when optional fields are omitted', async () => {
      const recordData = {
        lastPeriodDate: tomorrow,
        cycleLength: 28
      };

      const record = await MenstrualRecord.create(recordData);

      expect(record.flowIntensity).toBe('Medium');
      expect(record.symptoms).toEqual([]);
      expect(record.notes).toBe('');
    });
  });

  describe('Validation Errors', () => {
    it('should fail when lastPeriodDate is missing', async () => {
      const recordData = {
        cycleLength: 28
      };

      await expect(MenstrualRecord.create(recordData)).rejects.toThrow();
    });

    it('should fail when cycleLength is missing', async () => {
      const recordData = {
        lastPeriodDate: tomorrow
      };

      await expect(MenstrualRecord.create(recordData)).rejects.toThrow();
    });

    it('should fail when lastPeriodDate is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recordData = {
        lastPeriodDate: yesterday,
        cycleLength: 28
      };

      await expect(MenstrualRecord.create(recordData)).rejects.toThrow('Start date cannot be in the past');
    });
  });

  describe('Flow Intensity Enum Validation', () => {
    it('should accept valid flow intensity values', async () => {
      const validValues = ['Light', 'Medium', 'Heavy'];

      for (const value of validValues) {
        const record = await MenstrualRecord.create({
          lastPeriodDate: tomorrow,
          cycleLength: 28,
          flowIntensity: value
        });
        expect(record.flowIntensity).toBe(value);
      }
    });
  });

  describe('Schema Structure', () => {
    it('should have timestamps enabled', async () => {
      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28
      });

      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle array of symptoms', async () => {
      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        symptoms: ['Cramps', 'Headache', 'Fatigue']
      });

      expect(record.symptoms).toHaveLength(3);
      expect(record.symptoms).toContain('Cramps');
      expect(record.symptoms).toContain('Headache');
      expect(record.symptoms).toContain('Fatigue');
    });

    it('should store notes as string', async () => {
      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28,
        notes: 'This is a detailed note about the period'
      });

      expect(typeof record.notes).toBe('string');
      expect(record.notes).toBe('This is a detailed note about the period');
    });
  });

  describe('Database Operations', () => {
    it('should update an existing record', async () => {
      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28
      });

      record.cycleLength = 30;
      record.flowIntensity = 'Heavy';
      const updated = await record.save();

      expect(updated.cycleLength).toBe(30);
      expect(updated.flowIntensity).toBe('Heavy');
    });

    it('should delete a record', async () => {
      const record = await MenstrualRecord.create({
        lastPeriodDate: tomorrow,
        cycleLength: 28
      });

      await MenstrualRecord.deleteOne({ _id: record._id });

      const found = await MenstrualRecord.findById(record._id);
      expect(found).toBeNull();
    });

    it('should find all records sorted by creation date', async () => {
      const date1 = new Date(tomorrow);
      const date2 = new Date(tomorrow);
      date2.setDate(date2.getDate() + 1);

      await MenstrualRecord.create({
        lastPeriodDate: date1,
        cycleLength: 28
      });
      await MenstrualRecord.create({
        lastPeriodDate: date2,
        cycleLength: 30
      });

      const records = await MenstrualRecord.find().sort({ createdAt: -1 });

      expect(records).toHaveLength(2);
      expect(records[0].createdAt.getTime()).toBeGreaterThanOrEqual(records[1].createdAt.getTime());
    });
  });
});
