const cartController = require('../../../src/controllers/cartController');
const Cart = require('../../../src/models/Cart');
const Product = require('../../../src/models/Product');
const mongoose = require('mongoose');

jest.mock('../../../src/models/Cart');
jest.mock('../../../src/models/Product');

describe('Cart Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return cart for authenticated user', async () => {
      req.user = { _id: 'user123' };
      const mockCart = {
        userId: 'user123',
        items: [{ productId: 'prod1', qty: 2, priceAtTime: 10 }]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });

    it('should create new cart if none exists', async () => {
      req.user = { _id: 'newuser' };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Cart.create.mockResolvedValue({ userId: 'newuser', items: [], status: 'ACTIVE' });

      await cartController.getCart(req, res, next);

      expect(Cart.create).toHaveBeenCalledWith({ userId: 'newuser', items: [], status: 'ACTIVE' });
    });

    it('should use guest ID from headers', async () => {
      req.headers['x-guest-id'] = 'guest456';

      const mockCart = { userId: 'guest456', items: [] };
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ userId: 'guest456', status: 'ACTIVE' });
    });

    it('should default to GUEST if no user or guest ID', async () => {
      const mockCart = { userId: 'GUEST', items: [] };
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ userId: 'GUEST', status: 'ACTIVE' });
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'prod123', qty: 2 };

      const mockProduct = { _id: 'prod123', price: 10, stockQty: 10, name: 'Test Product' };
      Product.findById.mockResolvedValue(mockProduct);

      const mockCart = {
        userId: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ userId: 'user123', items: [{ productId: 'prod123', qty: 2 }] })
      };
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.addToCart(req, res, next);

      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0].qty).toBe(2);
    });

    it('should increment quantity for existing item', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'prod123', qty: 2 };

      const mockProduct = { _id: 'prod123', price: 10, stockQty: 10 };
      Product.findById.mockResolvedValue(mockProduct);

      const existingItem = { productId: { toString: () => 'prod123' }, qty: 1, priceAtTime: 10 };
      const mockCart = {
        userId: 'user123',
        items: [existingItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ userId: 'user123', items: [{ productId: 'prod123', qty: 3 }] })
      };
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.addToCart(req, res, next);

      expect(existingItem.qty).toBe(3);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if product not found', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'nonexistent', qty: 1 };

      Product.findById.mockResolvedValue(null);

      await cartController.addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Product not found' });
    });

    it('should return 400 if quantity is less than 1', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'prod123', qty: 0 };

      const mockProduct = { _id: 'prod123', price: 10, stockQty: 10 };
      Product.findById.mockResolvedValue(mockProduct);

      await cartController.addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if product out of stock', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'prod123', qty: 5 };

      const mockProduct = { _id: 'prod123', price: 10, stockQty: 3 };
      Product.findById.mockResolvedValue(mockProduct);

      await cartController.addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: expect.stringContaining('stock') }));
    });

    it('should create new cart if none exists', async () => {
      req.user = { _id: 'user123' };
      req.body = { productId: 'prod123', qty: 2 };

      const mockProduct = { _id: 'prod123', price: 10, stockQty: 10 };
      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);

      const newCart = { userId: 'user123', items: [{ productId: 'prod123', qty: 2, priceAtTime: 10 }] };
      Cart.create.mockResolvedValue(newCart);

      await cartController.addToCart(req, res, next);

      expect(Cart.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getCartById', () => {
    it('should return cart by ID', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockCart = { _id: '507f1f77bcf86cd799439011', userId: 'user123', items: [] };
      Cart.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCartById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, cart: mockCart });
    });

    it('should return 400 for invalid cart ID', async () => {
      req.params = { id: 'invalid-id' };

      await cartController.getCartById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if cart not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Cart.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await cartController.getCartById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateCart', () => {
    it('should update cart with valid items', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {
        items: [{ productId: '507f1f77bcf86cd799439022', qty: 3, priceAtTime: 15 }],
        status: 'ACTIVE'
      };

      const mockCart = { _id: '507f1f77bcf86cd799439011', items: [{ productId: '507f1f77bcf86cd799439022', qty: 3, priceAtTime: 15 }], status: 'ACTIVE' };
      Cart.findByIdAndUpdate.mockResolvedValue(mockCart);

      await cartController.updateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 for invalid cart ID', async () => {
      req.params = { id: 'invalid-id' };

      await cartController.updateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if items is not an array', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { items: 'not-an-array' };

      await cartController.updateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if item has invalid productId', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { items: [{ productId: 'invalid', qty: 1, priceAtTime: 10 }] };

      await cartController.updateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('productId') }));
    });

    it('should return 400 if item has invalid qty', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { items: [{ productId: '507f1f77bcf86cd799439022', qty: 0, priceAtTime: 10 }] };

      await cartController.updateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('qty') }));
    });
  });

  describe('deleteCart', () => {
    it('should delete cart successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockCart = { _id: '507f1f77bcf86cd799439011', userId: 'user123' };
      Cart.findByIdAndDelete.mockResolvedValue(mockCart);

      await cartController.deleteCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 for invalid cart ID', async () => {
      req.params = { id: 'invalid-id' };

      await cartController.deleteCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if cart not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      Cart.findByIdAndDelete.mockResolvedValue(null);

      await cartController.deleteCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getCartSummary', () => {
    it('should return cart summary with calculated totals', async () => {
      req.user = { _id: 'user123' };

      const mockCart = {
        userId: 'user123',
        items: [
          { productId: 'prod1', qty: 2, priceAtTime: 10 },
          { productId: 'prod2', qty: 1, priceAtTime: 15 }
        ]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCartSummary(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        summary: { subtotal: 35, shipping: 0, tax: 0, total: 35 }
      });
    });

    it('should handle empty cart', async () => {
      req.user = { _id: 'user123' };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ userId: 'user123', items: [] })
      });

      await cartController.getCartSummary(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        summary: { subtotal: 0, shipping: 0, tax: 0, total: 0 }
      });
    });
  });

  describe('mergeGuestCart', () => {
    it('should merge guest cart into user cart', async () => {
      req.user = { _id: 'user123' };
      req.headers['x-guest-id'] = 'guest456';

      const guestCart = {
        userId: 'guest456',
        items: [{ productId: { toString: () => 'prod1' }, qty: 2, priceAtTime: 10 }],
        save: jest.fn().mockResolvedValue(true)
      };

      const userCart = {
        userId: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ userId: 'user123', items: [{ productId: 'prod1', qty: 2 }] })
      };

      Cart.findOne.mockResolvedValueOnce(guestCart);
      Cart.findOne.mockResolvedValueOnce(userCart);

      await cartController.mergeGuestCart(req, res, next);

      expect(userCart.items).toHaveLength(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ merged: true }));
    });

    it('should not merge if no guest ID', async () => {
      req.user = { _id: 'user123' };
      req.body = {};
      req.headers = {};

      await cartController.mergeGuestCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ merged: false }));
    });

    it('should not merge if guest cart is empty', async () => {
      req.user = { _id: 'user123' };
      req.headers['x-guest-id'] = 'guest456';

      Cart.findOne.mockResolvedValue({ userId: 'guest456', items: [], status: 'ACTIVE' });

      await cartController.mergeGuestCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ merged: false }));
    });

    it('should transfer guest cart if user cart is empty', async () => {
      req.user = { _id: 'user123' };
      req.headers['x-guest-id'] = 'guest456';

      const guestCart = {
        userId: 'guest456',
        items: [{ productId: 'prod1', qty: 2, priceAtTime: 10 }],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ userId: 'user123', items: [{ productId: 'prod1', qty: 2 }] })
      };

      Cart.findOne.mockResolvedValueOnce(guestCart);
      Cart.findOne.mockResolvedValueOnce(null);

      await cartController.mergeGuestCart(req, res, next);

      expect(guestCart.userId).toBe('user123');
    });
  });
});
