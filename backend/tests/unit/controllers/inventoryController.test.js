const inventoryController = require('../../../src/controllers/inventoryController');
const Inventory = require('../../../src/models/Inventory');
const axios = require('axios');

jest.mock('../../../src/models/Inventory');
jest.mock('axios');
jest.mock('../../../src/utils/emailService', () => ({
  sendLowStockEmail: jest.fn().mockResolvedValue(true)
}));

describe('Inventory Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createInventory', () => {
    it('should create inventory with valid data', async () => {
      req.body = {
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo'
      };

      const mockInventory = {
        _id: '123',
        productType: 'Sanitary Pads',
        totalStock: 100,
        centerLocation: 'Colombo'
      };

      Inventory.create.mockResolvedValue(mockInventory);

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockInventory);
    });

    it('should return 400 if productType is missing', async () => {
      req.body = {
        totalStock: 100,
        centerLocation: 'Colombo'
      };

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'productType and centerLocation are required'
      }));
    });

    it('should return 400 if centerLocation is missing', async () => {
      req.body = {
        productType: 'Pads',
        totalStock: 100
      };

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should default totalStock to 0 if not provided', async () => {
      req.body = {
        productType: 'Tampons',
        centerLocation: 'Kandy'
      };

      Inventory.create.mockResolvedValue({
        productType: 'Tampons',
        centerLocation: 'Kandy',
        totalStock: 0
      });

      await inventoryController.createInventory(req, res);

      expect(Inventory.create).toHaveBeenCalledWith(expect.objectContaining({
        totalStock: 0
      }));
    });

    it('should return 409 for duplicate inventory', async () => {
      req.body = {
        productType: 'Pads',
        totalStock: 100,
        centerLocation: 'Colombo'
      };

      const error = new Error('Duplicate');
      error.code = 11000;
      Inventory.create.mockRejectedValue(error);

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 for validation errors', async () => {
      req.body = {
        productType: 'Pads',
        centerLocation: 'Colombo'
      };

      Inventory.create.mockRejectedValue(new Error('Validation failed'));

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getInventory', () => {
    it('should return all inventory items', async () => {
      const mockItems = [
        { productType: 'Pads', totalStock: 100 },
        { productType: 'Tampons', totalStock: 50 }
      ];

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockItems)
      });

      await inventoryController.getInventory(req, res);

      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should filter by productType', async () => {
      req.query = { productType: 'Pads' };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ productType: 'Pads', totalStock: 100 }])
      });

      await inventoryController.getInventory(req, res);

      expect(Inventory.find).toHaveBeenCalledWith({ productType: 'Pads' });
    });

    it('should filter by centerLocation', async () => {
      req.query = { centerLocation: 'Colombo' };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ centerLocation: 'Colombo' }])
      });

      await inventoryController.getInventory(req, res);

      expect(Inventory.find).toHaveBeenCalledWith({ centerLocation: 'Colombo' });
    });

    it('should filter by both productType and centerLocation', async () => {
      req.query = { productType: 'Pads', centerLocation: 'Colombo' };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await inventoryController.getInventory(req, res);

      expect(Inventory.find).toHaveBeenCalledWith({
        productType: 'Pads',
        centerLocation: 'Colombo'
      });
    });

    it('should handle errors', async () => {
      Inventory.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await inventoryController.getInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getInventoryById', () => {
    it('should return inventory by ID', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockInventory = { _id: '507f1f77bcf86cd799439011', productType: 'Pads', totalStock: 100 };
      Inventory.findById.mockResolvedValue(mockInventory);

      await inventoryController.getInventoryById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockInventory);
    });

    it('should return 404 if inventory not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Inventory.findById.mockResolvedValue(null);

      await inventoryController.getInventoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid ID', async () => {
      req.params = { id: 'invalid-id' };

      Inventory.findById.mockRejectedValue(new Error('Invalid ID'));

      await inventoryController.getInventoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { totalStock: 150 };

      const mockInventory = { _id: '507f1f77bcf86cd799439011', totalStock: 150 };
      Inventory.findByIdAndUpdate.mockResolvedValue(mockInventory);

      await inventoryController.updateInventory(req, res);

      expect(res.json).toHaveBeenCalledWith(mockInventory);
      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ totalStock: 150, lastUpdated: expect.any(Date) }),
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if inventory not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { totalStock: 150 };

      Inventory.findByIdAndUpdate.mockResolvedValue(null);

      await inventoryController.updateInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for validation errors', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { totalStock: -10 };

      Inventory.findByIdAndUpdate.mockRejectedValue(new Error('Validation failed'));

      await inventoryController.updateInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteInventory', () => {
    it('should delete inventory successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockInventory = { _id: '507f1f77bcf86cd799439011', productType: 'Pads' };
      Inventory.findByIdAndDelete.mockResolvedValue(mockInventory);

      await inventoryController.deleteInventory(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Inventory deleted successfully' });
    });

    it('should return 404 if inventory not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Inventory.findByIdAndDelete.mockResolvedValue(null);

      await inventoryController.deleteInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid ID', async () => {
      req.params = { id: 'invalid-id' };

      Inventory.findByIdAndDelete.mockRejectedValue(new Error('Invalid ID'));

      await inventoryController.deleteInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('adjustStock', () => {
    it('should increase stock successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { change: 50 };

      const mockInventory = {
        _id: '507f1f77bcf86cd799439011',
        productType: 'Pads',
        totalStock: 100,
        centerLocation: 'Colombo',
        save: jest.fn().mockResolvedValue(true)
      };

      Inventory.findById.mockResolvedValue(mockInventory);

      await inventoryController.adjustStock(req, res);

      expect(mockInventory.totalStock).toBe(150);
      expect(mockInventory.save).toHaveBeenCalled();
    });

    it('should decrease stock successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { change: -30 };

      const mockInventory = {
        _id: '507f1f77bcf86cd799439011',
        productType: 'Pads',
        totalStock: 100,
        centerLocation: 'Colombo',
        save: jest.fn().mockResolvedValue(true)
      };

      Inventory.findById.mockResolvedValue(mockInventory);

      await inventoryController.adjustStock(req, res);

      expect(mockInventory.totalStock).toBe(70);
    });

    it('should return 400 if change is not a number', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { change: 'not-a-number' };

      await inventoryController.adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if inventory not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { change: 10 };

      Inventory.findById.mockResolvedValue(null);

      await inventoryController.adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if insufficient stock for decrease', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { change: -150 };

      const mockInventory = {
        _id: '507f1f77bcf86cd799439011',
        totalStock: 100,
        save: jest.fn()
      };

      Inventory.findById.mockResolvedValue(mockInventory);

      await inventoryController.adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient stock' });
    });
  });

  describe('reverseGeocodeCenter', () => {
    it('should return geocode data successfully', async () => {
      req.query = { lat: '6.9271', lng: '79.8612' };

      const mockResponse = {
        data: {
          display_name: 'Colombo, Sri Lanka',
          address: { city: 'Colombo', country: 'Sri Lanka' }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await inventoryController.reverseGeocodeCenter(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        input: { lat: '6.9271', lng: '79.8612' },
        display_name: 'Colombo, Sri Lanka'
      }));
    });

    it('should return 400 if lat or lng is missing', async () => {
      req.query = { lat: '6.9271' };

      await inventoryController.reverseGeocodeCenter(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 502 if external API fails', async () => {
      req.query = { lat: '6.9271', lng: '79.8612' };

      axios.get.mockRejectedValue(new Error('Network error'));

      await inventoryController.reverseGeocodeCenter(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });
  });
});
