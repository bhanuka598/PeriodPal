const Inventory = require('../../../src/models/Inventory');

describe('Inventory Model', () => {
  describe('Valid Inventory Creation', () => {
    it('should create inventory with all required fields', async () => {
      const inventoryData = {
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Center'
      };

      const inventory = await Inventory.create(inventoryData);

      expect(inventory).toBeDefined();
      expect(inventory.productType).toBe('Sanitary Pads');
      expect(inventory.totalStock).toBe(100);
      expect(inventory.centerLocation).toBe('Colombo Center');
      expect(inventory.lastUpdated).toBeInstanceOf(Date);
    });

    it('should create inventory with default stock of 0', async () => {
      const inventory = await Inventory.create({
        productType: 'Tampons',
        centerLocation: 'Kandy Center'
      });

      expect(inventory.totalStock).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should fail without productType', async () => {
      const inventoryData = {
        totalStock: 50,
        centerLocation: 'Colombo'
      };

      await expect(Inventory.create(inventoryData)).rejects.toThrow();
    });

    it('should fail without centerLocation', async () => {
      const inventoryData = {
        productType: 'Pads',
        totalStock: 50
      };

      await expect(Inventory.create(inventoryData)).rejects.toThrow();
    });

    it('should reject negative stock values', async () => {
      const inventoryData = {
        productType: 'Pads',
        totalStock: -10,
        centerLocation: 'Colombo'
      };

      await expect(Inventory.create(inventoryData)).rejects.toThrow();
    });
  });

  describe('Unique Constraint', () => {
    it('should enforce unique productType + centerLocation combination', async () => {
      await Inventory.create({
        productType: 'Unique Product',
        totalStock: 50,
        centerLocation: 'Unique Center'
      });

      // Try to create duplicate
      await expect(
        Inventory.create({
          productType: 'Unique Product',
          totalStock: 30,
          centerLocation: 'Unique Center'
        })
      ).rejects.toThrow();
    });

    it('should allow same productType at different locations', async () => {
      const inv1 = await Inventory.create({
        productType: 'Same Product',
        totalStock: 50,
        centerLocation: 'Location A'
      });

      const inv2 = await Inventory.create({
        productType: 'Same Product',
        totalStock: 30,
        centerLocation: 'Location B'
      });

      expect(inv1).toBeDefined();
      expect(inv2).toBeDefined();
    });

    it('should allow different products at same location', async () => {
      const inv1 = await Inventory.create({
        productType: 'Product A',
        totalStock: 50,
        centerLocation: 'Same Location'
      });

      const inv2 = await Inventory.create({
        productType: 'Product B',
        totalStock: 30,
        centerLocation: 'Same Location'
      });

      expect(inv1).toBeDefined();
      expect(inv2).toBeDefined();
    });
  });

  describe('String Trimming', () => {
    it('should trim productType', async () => {
      const inventory = await Inventory.create({
        productType: '  Padded Product  ',
        totalStock: 50,
        centerLocation: 'Center'
      });

      expect(inventory.productType).toBe('Padded Product');
    });

    it('should trim centerLocation', async () => {
      const inventory = await Inventory.create({
        productType: 'Product',
        totalStock: 50,
        centerLocation: '  Main Center  '
      });

      expect(inventory.centerLocation).toBe('Main Center');
    });
  });

  describe('Database Operations', () => {
    it('should update stock quantity', async () => {
      const inventory = await Inventory.create({
        productType: 'Update Product',
        totalStock: 50,
        centerLocation: 'Update Center'
      });

      inventory.totalStock = 75;
      const updated = await inventory.save();

      expect(updated.totalStock).toBe(75);
    });

    it('should update lastUpdated timestamp', async () => {
      const inventory = await Inventory.create({
        productType: 'Timestamp Product',
        totalStock: 50,
        centerLocation: 'Timestamp Center'
      });

      const originalDate = inventory.lastUpdated;

      // Wait a bit then update
      await new Promise(resolve => setTimeout(resolve, 10));
      inventory.totalStock = 75;
      const updated = await inventory.save();

      expect(updated.lastUpdated.getTime()).toBeGreaterThanOrEqual(originalDate.getTime());
    });

    it('should find inventory by productType', async () => {
      await Inventory.create({
        productType: 'Searchable Product',
        totalStock: 100,
        centerLocation: 'Search Center'
      });

      const found = await Inventory.findOne({ productType: 'Searchable Product' });

      expect(found).toBeDefined();
      expect(found.centerLocation).toBe('Search Center');
    });

    it('should find inventory by centerLocation', async () => {
      await Inventory.create({
        productType: 'Product at Location',
        totalStock: 100,
        centerLocation: 'Specific Location'
      });

      const found = await Inventory.findOne({ centerLocation: 'Specific Location' });

      expect(found).toBeDefined();
    });

    it('should sort by lastUpdated', async () => {
      await Inventory.create({
        productType: 'Old Product',
        totalStock: 50,
        centerLocation: 'Old Center',
        lastUpdated: new Date('2023-01-01')
      });

      await Inventory.create({
        productType: 'New Product',
        totalStock: 50,
        centerLocation: 'New Center',
        lastUpdated: new Date('2024-01-01')
      });

      const results = await Inventory.find().sort({ lastUpdated: -1 });

      expect(results[0].productType).toBe('New Product');
      expect(results[1].productType).toBe('Old Product');
    });

    it('should delete inventory', async () => {
      const inventory = await Inventory.create({
        productType: 'Delete Product',
        totalStock: 50,
        centerLocation: 'Delete Center'
      });

      await Inventory.deleteOne({ _id: inventory._id });

      const found = await Inventory.findById(inventory._id);
      expect(found).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const inventory = await Inventory.create({
        productType: 'Timestamp Product',
        totalStock: 50,
        centerLocation: 'Timestamp Center'
      });

      expect(inventory.createdAt).toBeInstanceOf(Date);
      expect(inventory.updatedAt).toBeInstanceOf(Date);
    });
  });
});
