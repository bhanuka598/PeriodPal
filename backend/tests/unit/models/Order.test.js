const Order = require('../../../src/models/Order');
const mongoose = require('mongoose');

describe('Order Model', () => {
  const mockProductId = new mongoose.Types.ObjectId();
  const mockUserId = new mongoose.Types.ObjectId();

  describe('Valid Order Creation', () => {
    it('should create order with all required fields', async () => {
      const orderData = {
        userId: mockUserId.toString(),
        items: [{
          productId: mockProductId,
          qty: 2,
          priceAtTime: 15.99
        }],
        subtotal: 31.98,
        shipping: 5.00,
        tax: 2.00,
        total: 38.98
      };

      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order.userId).toBe(mockUserId.toString());
      expect(order.items).toHaveLength(1);
      expect(order.subtotal).toBe(31.98);
      expect(order.shipping).toBe(5.00);
      expect(order.tax).toBe(2.00);
      expect(order.total).toBe(38.98);
      expect(order.orderStatus).toBe('PENDING');
    });

    it('should create order with default values', async () => {
      const orderData = {
        userId: 'guest123',
        items: [],
        subtotal: 0,
        total: 0
      };

      const order = await Order.create(orderData);

      expect(order.shipping).toBe(0);
      expect(order.tax).toBe(0);
      expect(order.orderStatus).toBe('PENDING');
      expect(order.payment.status).toBe('UNPAID');
      expect(order.payment.method).toBe('MOCK');
    });

    it('should create order with contact info', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: 50.00,
        total: 50.00,
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        }
      };

      const order = await Order.create(orderData);

      expect(order.contactInfo.firstName).toBe('John');
      expect(order.contactInfo.email).toBe('john@example.com');
    });

    it('should create order with multiple items', async () => {
      const orderData = {
        userId: 'user456',
        items: [
          { productId: new mongoose.Types.ObjectId(), qty: 1, priceAtTime: 10.00 },
          { productId: new mongoose.Types.ObjectId(), qty: 2, priceAtTime: 20.00 }
        ],
        subtotal: 50.00,
        total: 50.00
      };

      const order = await Order.create(orderData);

      expect(order.items).toHaveLength(2);
      expect(order.items[0].qty).toBe(1);
      expect(order.items[1].qty).toBe(2);
    });
  });

  describe('Required Fields', () => {
    it('should require userId', async () => {
      const orderData = {
        items: [],
        subtotal: 10.00,
        total: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should require subtotal', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        total: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should require total', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    // Skipped: Model allows empty items array by default
  });

  describe('Order Item Validation', () => {
    it('should require productId in items', async () => {
      const orderData = {
        userId: 'user123',
        items: [{ qty: 1, priceAtTime: 10.00 }],
        subtotal: 10.00,
        total: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should require qty in items', async () => {
      const orderData = {
        userId: 'user123',
        items: [{ productId: mockProductId, priceAtTime: 10.00 }],
        subtotal: 10.00,
        total: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should require priceAtTime in items', async () => {
      const orderData = {
        userId: 'user123',
        items: [{ productId: mockProductId, qty: 1 }],
        subtotal: 10.00,
        total: 10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should reject qty less than 1', async () => {
      const orderData = {
        userId: 'user123',
        items: [{ productId: mockProductId, qty: 0, priceAtTime: 10.00 }],
        subtotal: 0,
        total: 0
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should reject negative priceAtTime', async () => {
      const orderData = {
        userId: 'user123',
        items: [{ productId: mockProductId, qty: 1, priceAtTime: -5.00 }],
        subtotal: -5.00,
        total: -5.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });
  });

  describe('Order Status Enum', () => {
    it('should accept valid orderStatus values', async () => {
      const statuses = ['PENDING', 'PAID', 'FAILED'];

      for (const status of statuses) {
        const order = await Order.create({
          userId: `user_${status}`,
          items: [],
          subtotal: 10.00,
          total: 10.00,
          orderStatus: status
        });
        expect(order.orderStatus).toBe(status);
      }
    });

    it('should default orderStatus to PENDING', async () => {
      const order = await Order.create({
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      expect(order.orderStatus).toBe('PENDING');
    });
  });

  describe('Payment Status Enum', () => {
    it('should accept valid payment.status values', async () => {
      const statuses = ['UNPAID', 'PENDING', 'PAID', 'FAILED'];

      for (const status of statuses) {
        const order = await Order.create({
          userId: `user_${status}`,
          items: [],
          subtotal: 10.00,
          total: 10.00,
          payment: { status }
        });
        expect(order.payment.status).toBe(status);
      }
    });
  });

  describe('Payment Method Enum', () => {
    it('should accept valid payment.method values', async () => {
      const methods = ['MOCK', 'STRIPE'];

      for (const method of methods) {
        const order = await Order.create({
          userId: `user_${method}`,
          items: [],
          subtotal: 10.00,
          total: 10.00,
          payment: { method }
        });
        expect(order.payment.method).toBe(method);
      }
    });

    it('should default payment.method to MOCK', async () => {
      const order = await Order.create({
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      expect(order.payment.method).toBe('MOCK');
    });
  });

  describe('Price Validation', () => {
    it('should reject negative subtotal', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: -10.00,
        total: -10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should reject negative total', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        total: -10.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should reject negative shipping', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        shipping: -5.00,
        total: 5.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should reject negative tax', async () => {
      const orderData = {
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        tax: -2.00,
        total: 8.00
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should update order status', async () => {
      const order = await Order.create({
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      order.orderStatus = 'PAID';
      const updated = await order.save();

      expect(updated.orderStatus).toBe('PAID');
    });

    it('should update payment status', async () => {
      const order = await Order.create({
        userId: 'user123',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      order.payment.status = 'PAID';
      order.payment.transactionId = 'TXN_123';
      const updated = await order.save();

      expect(updated.payment.status).toBe('PAID');
      expect(updated.payment.transactionId).toBe('TXN_123');
    });

    it('should find orders by userId', async () => {
      await Order.create({
        userId: 'specificUser',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      const orders = await Order.find({ userId: 'specificUser' });

      expect(orders).toHaveLength(1);
    });

    it('should find orders by status', async () => {
      await Order.create({
        userId: 'user1',
        items: [],
        subtotal: 10.00,
        total: 10.00,
        orderStatus: 'PAID'
      });

      await Order.create({
        userId: 'user2',
        items: [],
        subtotal: 20.00,
        total: 20.00,
        orderStatus: 'PENDING'
      });

      const paidOrders = await Order.find({ orderStatus: 'PAID' });

      expect(paidOrders).toHaveLength(1);
      expect(paidOrders[0].userId).toBe('user1');
    });

    it('should sort orders by creation date', async () => {
      await Order.create({
        userId: 'oldUser',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Order.create({
        userId: 'newUser',
        items: [],
        subtotal: 20.00,
        total: 20.00
      });

      const orders = await Order.find().sort({ createdAt: -1 });

      expect(orders[0].userId).toBe('newUser');
      expect(orders[1].userId).toBe('oldUser');
    });

    it('should delete an order', async () => {
      const order = await Order.create({
        userId: 'deleteUser',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      await Order.deleteOne({ _id: order._id });

      const found = await Order.findById(order._id);
      expect(found).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const order = await Order.create({
        userId: 'timestampUser',
        items: [],
        subtotal: 10.00,
        total: 10.00
      });

      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });
  });
});
