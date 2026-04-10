const request = require('supertest');
const { app } = require('./setup');
const Inventory = require('../../src/models/Inventory');

describe('Inventory API Integration Tests', () => {
  describe('POST /api/inventory', () => {
    it('should create inventory item successfully', async () => {
      const inventoryData = {
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(inventoryData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.productType).toBe(inventoryData.productType);
      expect(response.body.totalStock).toBe(inventoryData.totalStock);
      expect(response.body.centerLocation).toBe(inventoryData.centerLocation);
      expect(response.body).toHaveProperty('lastUpdated');

      // Verify in database
      const inventory = await Inventory.findOne({ productType: inventoryData.productType });
      expect(inventory).toBeTruthy();
      expect(inventory.totalStock).toBe(inventoryData.totalStock);
    });

    it('should fail to create with missing required fields', async () => {
      const inventoryData = {
        totalStock: 100
        // Missing productType and centerLocation
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(inventoryData)
        .expect(400);

      expect(response.body.message).toContain('productType and centerLocation are required');
    });

    it('should fail to create duplicate inventory for same product and location', async () => {
      const inventoryData = {
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      };

      // Create first inventory
      await request(app)
        .post('/api/inventory')
        .send(inventoryData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/inventory')
        .send(inventoryData)
        .expect(409);

      expect(response.body.message).toContain('Inventory already exists');
    });

    it('should handle negative stock', async () => {
      const inventoryData = {
        productType: 'Tampons',
        totalStock: -10,
        centerLocation: 'Kandy Center'
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(inventoryData)
        .expect(400);
    });
  });

  describe('GET /api/inventory', () => {
    beforeEach(async () => {
      await Inventory.create([
        {
          productType: 'Sanitary Pads',
          totalStock: 100,
          centerLocation: 'Colombo Distribution Center'
        },
        {
          productType: 'Tampons',
          totalStock: 50,
          centerLocation: 'Kandy Center'
        },
        {
          productType: 'Menstrual Cups',
          totalStock: 30,
          centerLocation: 'Galle Center'
        }
      ]);
    });

    it('should get all inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it('should filter inventory by productType', async () => {
      const response = await request(app)
        .get('/api/inventory?productType=Sanitary Pads')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].productType).toBe('Sanitary Pads');
    });

    it('should filter inventory by centerLocation', async () => {
      const response = await request(app)
        .get('/api/inventory?centerLocation=Kandy Center')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].centerLocation).toBe('Kandy Center');
    });

    it('should combine filters', async () => {
      const response = await request(app)
        .get('/api/inventory?productType=Sanitary Pads&centerLocation=Colombo Distribution Center')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].productType).toBe('Sanitary Pads');
      expect(response.body[0].centerLocation).toBe('Colombo Distribution Center');
    });

    it('should return empty array with no matching filters', async () => {
      const response = await request(app)
        .get('/api/inventory?productType=NonExistent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/inventory/:id', () => {
    let inventoryId;

    beforeEach(async () => {
      const inventory = await Inventory.create({
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      });
      inventoryId = inventory._id;
    });

    it('should get inventory by valid ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/${inventoryId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body._id).toBe(inventoryId.toString());
      expect(response.body.productType).toBe('Sanitary Pads');
    });

    it('should fail with invalid inventory ID', async () => {
      const response = await request(app)
        .get('/api/inventory/invalidid')
        .expect(400);

      expect(response.body.message).toContain('Invalid inventory id');
    });

    it('should fail with non-existent inventory ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/inventory/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('Inventory not found');
    });
  });

  describe('PUT /api/inventory/:id', () => {
    let inventoryId;

    beforeEach(async () => {
      const inventory = await Inventory.create({
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      });
      inventoryId = inventory._id;
    });

    it('should update inventory successfully', async () => {
      const updateData = {
        totalStock: 150,
        centerLocation: 'Updated Center'
      };

      const response = await request(app)
        .put(`/api/inventory/${inventoryId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.totalStock).toBe(updateData.totalStock);
      expect(response.body.centerLocation).toBe(updateData.centerLocation);
      expect(response.body).toHaveProperty('lastUpdated');

      // Verify in database
      const inventory = await Inventory.findById(inventoryId);
      expect(inventory.totalStock).toBe(updateData.totalStock);
    });

    it('should fail with invalid inventory ID', async () => {
      const response = await request(app)
        .put('/api/inventory/invalidid')
        .send({ totalStock: 150 })
        .expect(400);

      expect(response.body.message).toContain('Invalid inventory id');
    });

    it('should fail with non-existent inventory ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/inventory/${nonExistentId}`)
        .send({ totalStock: 150 })
        .expect(404);

      expect(response.body.message).toContain('Inventory not found');
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    let inventoryId;

    beforeEach(async () => {
      const inventory = await Inventory.create({
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      });
      inventoryId = inventory._id;
    });

    it('should delete inventory successfully', async () => {
      const response = await request(app)
        .delete(`/api/inventory/${inventoryId}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Verify deletion
      const inventory = await Inventory.findById(inventoryId);
      expect(inventory).toBeNull();
    });

    it('should fail with invalid inventory ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/invalidid')
        .expect(400);

      expect(response.body.message).toContain('Invalid inventory id');
    });

    it('should fail with non-existent inventory ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/inventory/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('Inventory not found');
    });
  });

  describe('PATCH /api/inventory/:id/adjust', () => {
    let inventoryId;

    beforeEach(async () => {
      const inventory = await Inventory.create({
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo Distribution Center'
      });
      inventoryId = inventory._id;
    });

    it('should increase stock successfully', async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryId}/adjust`)
        .send({ change: 50 })
        .expect(200);

      expect(response.body.message).toContain('Stock adjusted');
      expect(response.body.item.totalStock).toBe(150);

      // Verify in database
      const inventory = await Inventory.findById(inventoryId);
      expect(inventory.totalStock).toBe(150);
    });

    it('should decrease stock successfully', async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryId}/adjust`)
        .send({ change: -30 })
        .expect(200);

      expect(response.body.item.totalStock).toBe(70);

      // Verify in database
      const inventory = await Inventory.findById(inventoryId);
      expect(inventory.totalStock).toBe(70);
    });

    it('should fail to decrease stock below zero', async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryId}/adjust`)
        .send({ change: -150 })
        .expect(400);

      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should fail with non-numeric change', async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryId}/adjust`)
        .send({ change: 'not a number' })
        .expect(400);

      expect(response.body.message).toContain('change must be a number');
    });

    it('should fail with invalid inventory ID', async () => {
      const response = await request(app)
        .patch('/api/inventory/invalidid/adjust')
        .send({ change: 10 })
        .expect(404);

      expect(response.body.message).toContain('Inventory not found');
    });

    it('should fail with non-existent inventory ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/inventory/${nonExistentId}/adjust`)
        .send({ change: 10 })
        .expect(404);

      expect(response.body.message).toContain('Inventory not found');
    });
  });

  describe('GET /api/inventory/reverse-geocode', () => {
    it('should fail without lat and lng parameters', async () => {
      const response = await request(app)
        .get('/api/inventory/reverse-geocode')
        .expect(400);

      expect(response.body.message).toContain('lat and lng are required');
    });

    it('should fail with only lat parameter', async () => {
      const response = await request(app)
        .get('/api/inventory/reverse-geocode?lat=6.9271')
        .expect(400);

      expect(response.body.message).toContain('lat and lng are required');
    });

    it('should fail with only lng parameter', async () => {
      const response = await request(app)
        .get('/api/inventory/reverse-geocode?lng=79.8612')
        .expect(400);

      expect(response.body.message).toContain('lat and lng are required');
    });

    // Note: Actual geocoding test is skipped as it requires external API
    // This would be tested in a separate integration test with mocked external API
  });

  describe('Inventory Integration Flow', () => {
    it('should complete full inventory lifecycle: create -> read -> adjust -> update -> delete', async () => {
      // Step 1: Create
      const createData = {
        productType: 'Test Product',
        totalStock: 50,
        centerLocation: 'Test Center'
      };

      const createResponse = await request(app)
        .post('/api/inventory')
        .send(createData)
        .expect(201);

      const inventoryId = createResponse.body._id;

      // Step 2: Read
      const readResponse = await request(app)
        .get(`/api/inventory/${inventoryId}`)
        .expect(200);

      expect(readResponse.body.totalStock).toBe(50);

      // Step 3: Adjust stock
      const adjustResponse = await request(app)
        .patch(`/api/inventory/${inventoryId}/adjust`)
        .send({ change: 25 })
        .expect(200);

      expect(adjustResponse.body.item.totalStock).toBe(75);

      // Step 4: Update
      const updateResponse = await request(app)
        .put(`/api/inventory/${inventoryId}`)
        .send({ centerLocation: 'Updated Test Center' })
        .expect(200);

      expect(updateResponse.body.centerLocation).toBe('Updated Test Center');

      // Step 5: Delete
      const deleteResponse = await request(app)
        .delete(`/api/inventory/${inventoryId}`)
        .expect(200);

      expect(deleteResponse.body.message).toContain('deleted');

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/inventory/${inventoryId}`)
        .expect(404);
    });
  });
});
