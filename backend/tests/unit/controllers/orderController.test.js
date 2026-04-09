const orderController = require('../../../src/controllers/orderController');
const Order = require('../../../src/models/Order');
const Cart = require('../../../src/models/Cart');
const Product = require('../../../src/models/Product');
const sendEmail = require('../../../src/utils/sendEmail');
const mongoose = require('mongoose');

jest.mock('../../../src/models/Order');
jest.mock('../../../src/models/Cart');
jest.mock('../../../src/models/Product');
jest.mock('../../../src/utils/sendEmail');
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'session_123', url: 'https://checkout.stripe.com/test' })
      }
    }
  }));
});

describe('Order Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {},
      user: null,
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should create order from active cart', async () => {
      req.user = { _id: 'user123' };

      const mockCart = {
        userId: 'user123',
        status: 'ACTIVE',
        items: [
          { productId: 'prod1', qty: 2, priceAtTime: 10 },
          { productId: 'prod2', qty: 1, priceAtTime: 15 }
        ]
      };

      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        items: mockCart.items,
        subtotal: 35,
        shipping: 0,
        tax: 0,
        total: 35,
        orderStatus: 'PENDING'
      };

      Cart.findOne.mockResolvedValue(mockCart);
      Order.create.mockResolvedValue(mockOrder);

      await orderController.checkout(req, res, next);

      expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user123',
        subtotal: 35,
        total: 35
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if cart is empty', async () => {
      req.user = { _id: 'user123' };

      Cart.findOne.mockResolvedValue({ userId: 'user123', items: [], status: 'ACTIVE' });

      await orderController.checkout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cart is empty' });
    });

    it('should return 400 if no active cart', async () => {
      req.user = { _id: 'user123' };

      Cart.findOne.mockResolvedValue(null);

      await orderController.checkout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle guest checkout', async () => {
      req.headers['x-guest-id'] = 'guest456';

      const mockCart = {
        userId: 'guest456',
        status: 'ACTIVE',
        items: [{ productId: 'prod1', qty: 1, priceAtTime: 10 }]
      };

      Cart.findOne.mockResolvedValue(mockCart);
      Order.create.mockResolvedValue({ _id: 'order123', userId: 'guest456', total: 10 });

      await orderController.checkout(req, res, next);

      expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'guest456' }));
    });
  });

  describe('updateContact', () => {
    it('should update order contact info', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };
      req.body = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        contactInfo: {},
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findOne.mockResolvedValue(mockOrder);

      await orderController.updateContact(req, res, next);

      expect(mockOrder.contactInfo).toEqual(req.body);
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should return 404 if order not found', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      Order.findOne.mockResolvedValue(null);

      await orderController.updateContact(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('payOrder', () => {
    it('should process payment successfully', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        orderStatus: 'PENDING',
        contactInfo: { email: 'test@example.com' },
        items: [
          { productId: { _id: 'prod1', name: 'Product 1', stockQty: 10 }, qty: 2, priceAtTime: 10 }
        ],
        total: 20,
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      Cart.updateOne.mockResolvedValue({});
      sendEmail.mockResolvedValue(true);

      await orderController.payOrder(req, res, next);

      expect(mockOrder.orderStatus).toBe('PAID');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(Cart.updateOne).toHaveBeenCalled();
    });

    it('should return 400 if order already paid', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        orderStatus: 'PAID'
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.payOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no contact email', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        orderStatus: 'PENDING',
        contactInfo: {}
      };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.payOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if order not found', async () => {
      req.user = { _id: 'user123' };
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await orderController.payOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders for user', async () => {
      req.user = { _id: 'user123' };

      const mockOrders = [
        { _id: 'order1', userId: 'user123', total: 20 },
        { _id: 'order2', userId: 'user123', total: 30 }
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockOrders)
        })
      });

      await orderController.getAllOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: mockOrders,
        count: 2
      });
    });
  });

  describe('getMyDonationData', () => {
    it('should return donation data for donor', async () => {
      req.user = { _id: 'user123' };

      const mockOrders = [
        { _id: 'order1', orderStatus: 'PAID', total: 50, items: [{ qty: 2 }], updatedAt: new Date() },
        { _id: 'order2', orderStatus: 'PAID', total: 30, items: [{ qty: 1 }], updatedAt: new Date() }
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockOrders)
          })
        })
      });

      await orderController.getMyDonationData(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        stats: expect.objectContaining({
          totalContributed: 80,
          productUnits: 3
        })
      }));
    });

    it('should return 401 if not authenticated', async () => {
      req.user = null;

      await orderController.getMyDonationData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getAdminDonationStats', () => {
    it('should return admin donation stats', async () => {
      const mockOrders = [
        { items: [{ qty: 2 }, { qty: 1 }] },
        { items: [{ qty: 3 }] }
      ];

      Order.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockOrders)
      });

      await orderController.getAdminDonationStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        paidOrdersCount: 2,
        unitsPurchased: 6
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order by ID', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      const mockOrder = { _id: '507f1f77bcf86cd799439011', total: 50 };
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: mockOrder });
    });

    it('should return 400 for invalid order ID', async () => {
      req.params = { orderId: 'invalid-id' };

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if order not found', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      const mockOrder = { _id: '507f1f77bcf86cd799439011', total: 50 };
      Order.findByIdAndDelete.mockResolvedValue(mockOrder);

      await orderController.deleteOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid order ID', async () => {
      req.params = { orderId: 'invalid-id' };

      await orderController.deleteOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if order not found', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };

      Order.findByIdAndDelete.mockResolvedValue(null);

      await orderController.deleteOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };
      req.body = { orderStatus: 'PAID' };

      const mockOrder = { _id: '507f1f77bcf86cd799439011', orderStatus: 'PAID' };
      Order.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.updateOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid order ID', async () => {
      req.params = { orderId: 'invalid-id' };

      await orderController.updateOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if order not found', async () => {
      req.params = { orderId: '507f1f77bcf86cd799439011' };
      req.body = { orderStatus: 'PAID' };

      Order.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await orderController.updateOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
